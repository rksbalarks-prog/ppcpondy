// ignore_for_file: prefer_initializing_formals
import 'package:flutter/foundation.dart';

import 'assistant_client.dart';
import 'assistant_models.dart';
import 'assistant_voice.dart';

/// Owns the assistant conversation — the message list, the SSE stream wiring,
/// the session id, and confirm/reset. A direct port of the web `useAssistant`
/// hook. Lives as a single app-level instance (it survives navigation, so no
/// sessionStorage rehydrate is needed the way the web widget does).
class AssistantController extends ChangeNotifier {
  AssistantController({
    required AssistantClient client,
    required String Function() phoneProvider,
    required String loginFirstMessage,
  })  : _client = client,
        _phoneOf = phoneProvider,
        _loginFirst = loginFirstMessage {
    _sessionId = _newSessionId();
  }

  final AssistantClient _client;
  final String Function() _phoneOf;
  final String _loginFirst;

  final List<ChatMessage> messages = [];
  bool _busy = false;
  bool get busy => _busy;

  late String _sessionId;
  int _idSeq = 0;
  int get _nextId => ++_idSeq;

  String _newSessionId() =>
      'sess_flutter_${DateTime.now().microsecondsSinceEpoch}';

  /// Send a chat message and stream the reply. Returns the final assistant text
  /// (so the widget can speak it aloud when the speaker is on).
  Future<String?> send(String text, {String? lang}) async {
    final message = text.trim();
    if (message.isEmpty || _busy) return null;

    final phone = _phoneOf();
    if (phone.isEmpty) {
      messages.add(ChatMessage(
        id: _nextId,
        role: ChatRole.assistant,
        content: _loginFirst,
      ));
      notifyListeners();
      return null;
    }

    messages.add(ChatMessage(id: _nextId, role: ChatRole.user, content: message));
    final reply = ChatMessage(
      id: _nextId,
      role: ChatRole.assistant,
      content: '',
      streaming: true,
    );
    messages.add(reply);
    _busy = true;
    notifyListeners();

    var finalText = '';
    try {
      await _client.streamChat(
        phone: phone,
        message: message,
        sessionId: _sessionId,
        lang: lang,
        onEvent: (event, data) {
          switch (event) {
            case 'session':
              final sid = data is Map ? data['sessionId']?.toString() : null;
              if (sid != null && sid.isNotEmpty) _sessionId = sid;
              break;
            case 'token':
              final t = data is Map ? (data['text']?.toString() ?? '') : '';
              finalText += t;
              reply.content += t;
              notifyListeners();
              break;
            case 'results':
              final cards = <ResultCard>[];
              if (data is List) {
                for (final r in data) {
                  final res = r is Map ? r['result'] : null;
                  if (res is Map) {
                    final list = res['results'];
                    if (list is List) {
                      for (final c in list) {
                        if (c is Map) {
                          cards.add(ResultCard.fromJson(
                              c.map((k, v) => MapEntry('$k', v))));
                        }
                      }
                    }
                    final prop = res['property'];
                    if (prop is Map) {
                      cards.add(ResultCard.fromJson(
                          prop.map((k, v) => MapEntry('$k', v))));
                    }
                  }
                }
              }
              if (cards.isNotEmpty) {
                reply.cards.addAll(cards);
                if (reply.cards.length > 12) {
                  reply.cards.removeRange(12, reply.cards.length);
                }
                notifyListeners();
              }
              break;
            case 'action':
              if (data is Map) {
                reply.actions.add(AssistantAction.fromJson(
                    data.map((k, v) => MapEntry('$k', v))));
                notifyListeners();
              }
              break;
            case 'done':
              final t = data is Map ? data['text']?.toString() : null;
              if (t != null && t.isNotEmpty) {
                finalText = t;
                reply.content = t;
              }
              reply.streaming = false;
              notifyListeners();
              break;
            case 'error':
              final m = data is Map ? data['message']?.toString() : null;
              if (reply.content.isEmpty) {
                reply.content =
                    'Sorry, something went wrong (${m ?? 'error'}).';
              }
              reply.streaming = false;
              notifyListeners();
              break;
            default:
              break;
          }
        },
      );
    } catch (_) {
      if (reply.content.isEmpty) {
        reply.content = 'Sorry, I could not reach the assistant.';
      }
    } finally {
      _busy = false;
      reply.streaming = false;
      notifyListeners();
    }
    return finalText;
  }

  /// Confirm a proposed write action. Updates that action's state in place and,
  /// for an owner-contact reveal, appends the revealed number afterwards.
  Future<void> confirm(int msgId, int actionIdx) async {
    ChatMessage? msg;
    for (final m in messages) {
      if (m.id == msgId) {
        msg = m;
        break;
      }
    }
    if (msg == null || actionIdx >= msg.actions.length) return;
    final action = msg.actions[actionIdx];
    if (action.state == ActionState.working) return;

    action.state = ActionState.working;
    notifyListeners();

    try {
      final result = await _client.confirmAction(action);
      action.state = ActionState.done;
      notifyListeners();

      if (action.tool == 'request_contact_owner' && result['success'] != false) {
        final raw = action.body?['ppcId'] ?? action.body?['rentId'];
        final id = raw is int ? raw : int.tryParse('${raw ?? ''}');
        var text = 'Payment done, but I could not fetch the number right now. '
            'Please open property #$raw to view it.';
        if (id != null) {
          try {
            final c = await _client.fetchOwnerContact(id);
            final used = result['alreadyDeducted'] == true
                ? 'already unlocked earlier — no points charged'
                : '${action.body?['points']} points used';
            if (c.number.isNotEmpty) {
              text = '📞 Owner contact for #$id: ${c.number}'
                  '${c.alt.isNotEmpty ? '\nAlternate: ${c.alt}' : ''}\n($used)';
            }
          } catch (_) {/* keep fallback text */}
        }
        messages.add(ChatMessage(
          id: _nextId,
          role: ChatRole.assistant,
          content: text,
        ));
        notifyListeners();
      }
    } catch (e) {
      action.state = ActionState.error;
      action.error = e is AssistantException ? e.message : e.toString();
      notifyListeners();
    }
  }

  /// Start a fresh conversation.
  Future<void> reset() async {
    final old = _sessionId;
    _sessionId = _newSessionId();
    messages.clear();
    notifyListeners();
    final phone = _phoneOf();
    if (phone.isNotEmpty) {
      _client.resetSession(phone: phone, sessionId: old);
    }
  }

  // ── voice/status delegates (share the client's token) ─────────────────────
  Future<Uint8List?> speak(String text, String lang) {
    final phone = _phoneOf();
    if (phone.isEmpty || text.isEmpty) return Future.value(null);
    return _client.speakToBytes(phone: phone, text: text, lang: lang);
  }

  Future<String> transcribe(VoiceClip clip) async {
    final phone = _phoneOf();
    if (phone.isEmpty) return '';
    try {
      final r = await _client.transcribe(
        phone: phone,
        path: clip.path,
        mime: clip.mime,
        filename: clip.filename,
        bytes: clip.bytes, // web: blob already read; null on mobile
      );
      return (r['text']?.toString() ?? '').trim();
    } catch (_) {
      return '';
    }
  }

  Future<Map<String, dynamic>?> fetchStatus() => _client.fetchStatus();

  /// Push a canned assistant line (voice greeting, mic hints) without the model.
  void say(String text) {
    if (text.isEmpty) return;
    messages.add(ChatMessage(
      id: _nextId,
      role: ChatRole.assistant,
      content: text,
    ));
    notifyListeners();
  }
}
