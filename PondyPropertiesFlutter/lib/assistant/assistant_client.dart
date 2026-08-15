import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config.dart';
import 'assistant_models.dart';

class AssistantException implements Exception {
  final String message;
  AssistantException(this.message);
  @override
  String toString() => message;
}

/// Low-level assistant transport — token mint, SSE streaming chat (one 401→
/// re-mint retry), transcribe, speak, and write-action confirmation. A direct
/// port of the web `assistantClient.js`. The OpenAI key never touches the app;
/// this only talks to our own assistant backend + the canonical app API.
///
/// Uses `package:http` rather than the app's Dio client on purpose: Dio buffers
/// a response before handing it over, which would defeat the SSE stream, and the
/// assistant must not carry the `?base=PY|CH` interceptor (its own backend
/// already scopes every tool call to base=ALL).
class AssistantClient {
  AssistantClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  // Assistant service (SSE + voice).
  String get _base => AppConfig.assistantUrl;
  // Canonical app API — write confirmations POST here, exactly like the app.
  String get _appBase => AppConfig.apiUrl;

  static const _tokenKey = 'ppc_assist_token';
  String? _memToken;

  // ── token ───────────────────────────────────────────────────────────────
  Future<String?> _getToken() async {
    if (_memToken != null) return _memToken;
    final prefs = await SharedPreferences.getInstance();
    return _memToken = prefs.getString(_tokenKey);
  }

  Future<void> _setToken(String t) async {
    _memToken = t;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, t);
  }

  Future<void> _clearToken() async {
    _memToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<String> _mintToken(String phone) async {
    if (phone.isEmpty) throw AssistantException('not_logged_in');
    final res = await _client.post(
      Uri.parse('$_base/token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone}),
    );
    if (res.statusCode != 200) {
      throw AssistantException(_err(res.body) ?? 'token_failed');
    }
    final token = (jsonDecode(res.body) as Map)['token']?.toString() ?? '';
    if (token.isEmpty) throw AssistantException('token_failed');
    await _setToken(token);
    return token;
  }

  Future<String> _ensureToken(String phone) async =>
      (await _getToken()) ?? (await _mintToken(phone));

  // ── public status (greeting/enabled) ──────────────────────────────────────
  Future<Map<String, dynamic>?> fetchStatus() async {
    try {
      final res = await _client.get(Uri.parse('$_base/status'));
      if (res.statusCode != 200) return null;
      final j = jsonDecode(res.body);
      return j is Map<String, dynamic> ? j : null;
    } catch (_) {
      return null;
    }
  }

  // ── POST /chat (SSE) ──────────────────────────────────────────────────────
  /// Streams the reply, invoking [onEvent] per SSE frame. Handles one 401 by
  /// re-minting the token and retrying, exactly like the web client.
  Future<void> streamChat({
    required String phone,
    required String message,
    required String sessionId,
    String? lang,
    required void Function(String event, dynamic data) onEvent,
    bool retried = false,
  }) async {
    final token = await _ensureToken(phone);
    final req = http.Request('POST', Uri.parse('$_base/chat'));
    req.headers['Content-Type'] = 'application/json';
    req.headers['Authorization'] = 'Bearer $token';
    final payload = <String, dynamic>{'message': message, 'sessionId': sessionId};
    if (lang != null) payload['lang'] = lang;
    req.body = jsonEncode(payload);

    final res = await _client.send(req);

    if (res.statusCode == 401 && !retried) {
      await _clearToken();
      await _mintToken(phone);
      return streamChat(
        phone: phone,
        message: message,
        sessionId: sessionId,
        lang: lang,
        onEvent: onEvent,
        retried: true,
      );
    }
    if (res.statusCode != 200) {
      String detail = 'http_${res.statusCode}';
      try {
        final body = await res.stream.bytesToString();
        detail = _err(body) ?? detail;
      } catch (_) {}
      onEvent('error', {'message': detail});
      return;
    }

    var buf = '';
    await for (final chunk in res.stream.transform(utf8.decoder)) {
      buf += chunk;
      // Frames are separated by a blank line.
      int idx;
      while ((idx = buf.indexOf('\n\n')) != -1) {
        final raw = buf.substring(0, idx);
        buf = buf.substring(idx + 2);
        var event = 'message';
        var dataLine = '';
        for (final line in raw.split('\n')) {
          if (line.startsWith('event:')) {
            event = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            dataLine += line.substring(5).trim();
          }
        }
        if (dataLine.isEmpty) continue;
        dynamic data;
        try {
          data = jsonDecode(dataLine);
        } catch (_) {
          data = dataLine;
        }
        onEvent(event, data);
      }
    }
  }

  // ── POST /transcribe ──────────────────────────────────────────────────────
  Future<Map<String, dynamic>> transcribe({
    required String phone,
    required String path,
    required String mime,
    required String filename,
    Uint8List? bytes,
  }) async {
    Future<http.StreamedResponse> attempt(String token) async {
      final req = http.MultipartRequest('POST', Uri.parse('$_base/transcribe'));
      req.headers['Authorization'] = 'Bearer $token';
      // On web the clip is a blob URL rather than a file, so its bytes arrive
      // pre-read; fromPath would hit dart:io and throw.
      req.files.add(bytes != null
          ? http.MultipartFile.fromBytes(
              'audio',
              bytes,
              filename: filename,
              contentType: MediaType.parse(mime),
            )
          : await http.MultipartFile.fromPath(
              'audio',
              path,
              filename: filename,
              contentType: MediaType.parse(mime),
            ));
      return _client.send(req);
    }

    var token = await _ensureToken(phone);
    var res = await attempt(token);
    if (res.statusCode == 401) {
      await _clearToken();
      token = await _mintToken(phone);
      res = await attempt(token);
    }
    final body = await res.stream.bytesToString();
    final json = _tryJson(body) ?? {};
    if (res.statusCode != 200) {
      throw AssistantException(json['error']?.toString() ?? 'transcribe_failed');
    }
    return json;
  }

  // ── POST /speak → mp3 bytes (or null) ─────────────────────────────────────
  Future<Uint8List?> speakToBytes({
    required String phone,
    required String text,
    required String lang,
  }) async {
    Future<http.Response> attempt(String token) => _client.post(
          Uri.parse('$_base/speak'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'text': text, 'lang': lang, 'format': 'mp3'}),
        );

    try {
      var token = await _ensureToken(phone);
      var res = await attempt(token);
      if (res.statusCode == 401) {
        await _clearToken();
        token = await _mintToken(phone);
        res = await attempt(token);
      }
      if (res.statusCode != 200) return null;
      return res.bodyBytes;
    } catch (_) {
      return null;
    }
  }

  // ── Confirm a write action against the canonical app endpoint ─────────────
  Future<Map<String, dynamic>> confirmAction(AssistantAction action) async {
    final url = '$_appBase${action.endpoint}';
    final res = await _client.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(action.body ?? {}),
    );
    final json = _tryJson(res.body) ?? {};
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw AssistantException(
        json['error']?.toString() ?? json['message']?.toString() ?? 'action_failed',
      );
    }
    return json;
  }

  // ── After a contact reveal, read the owner's number from the property ─────
  Future<({String number, String alt})> fetchOwnerContact(int ppcId) async {
    final res = await _client.get(
      Uri.parse('$_appBase/property/$ppcId'),
      headers: {'Accept': 'application/json'},
    );
    final json = _tryJson(res.body) ?? {};
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw AssistantException(
        json['message']?.toString() ?? 'contact_fetch_failed',
      );
    }
    final p = (json['property'] ?? json['data'] ?? json);
    final map = p is Map ? p : const {};
    final number = (map['assignedPhoneNumber'] ??
            map['phoneNumber'] ??
            map['postedUserPhoneNumber'] ??
            '')
        .toString();
    final alt = (map['alternatePhone'] ??
            map['alternatePhoneNumber'] ??
            map['secondaryPhone'] ??
            '')
        .toString();
    return (number: number, alt: alt);
  }

  Future<void> resetSession({
    required String phone,
    required String sessionId,
  }) async {
    try {
      final token = await _ensureToken(phone);
      await _client.delete(
        Uri.parse('$_base/session/${Uri.encodeComponent(sessionId)}'),
        headers: {'Authorization': 'Bearer $token'},
      );
    } catch (_) {/* best-effort */}
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  Map<String, dynamic>? _tryJson(String body) {
    try {
      final j = jsonDecode(body);
      return j is Map<String, dynamic> ? j : null;
    } catch (_) {
      return null;
    }
  }

  String? _err(String body) {
    final j = _tryJson(body);
    final e = j?['error'];
    return e?.toString();
  }
}
