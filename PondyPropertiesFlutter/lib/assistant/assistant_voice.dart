import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import 'voice_bytes_stub.dart'
    if (dart.library.js_interop) 'voice_bytes_web.dart';

/// A finished recording ready to upload to /transcribe.
class VoiceClip {
  final String path;
  final String mime;
  final String filename;
  final int sizeBytes;

  /// Web only: the encoded audio, already read from the blob URL. Null on
  /// mobile, where the upload streams straight from [path].
  final Uint8List? bytes;

  const VoiceClip({
    required this.path,
    required this.mime,
    required this.filename,
    required this.sizeBytes,
    this.bytes,
  });
}

class MicResult {
  final bool ok;
  final String? error; // 'denied' | 'error'
  const MicResult(this.ok, [this.error]);
}

/// Voice I/O for the assistant — microphone capture with silence auto-stop
/// (hands-free VAD) and mp3 playback of the /speak reply. Ports the browser
/// `useVoice.js` (MediaRecorder + Web Audio VAD) onto the native `record` +
/// `audioplayers` plugins.
class AssistantVoice {
  final AudioRecorder _rec = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();

  int _seq = 0;
  bool _recording = false;
  bool _cancelled = false;

  // VAD tuning (dBFS: 0 = loudest, more negative = quieter).
  static const double _loudDb = -40.0; // above this counts as speech
  static const Duration _tick = Duration(milliseconds: 180);
  static const Duration _silenceHold = Duration(milliseconds: 1200);
  static const Duration _maxClip = Duration(seconds: 15);
  static const Duration _noSpeechTimeout = Duration(seconds: 7);

  // Web records through record_web (MediaRecorder). dart:io Platform throws on
  // web, so kIsWeb must short-circuit before it is touched.
  bool get supported => kIsWeb || Platform.isAndroid || Platform.isIOS;
  bool get isRecording => _recording;

  Future<MicResult> ensureMic() async {
    try {
      final ok = await _rec.hasPermission();
      return MicResult(ok, ok ? null : 'denied');
    } catch (_) {
      return const MicResult(false, 'error');
    }
  }

  Future<String> _newPath() async {
    // record_web ignores the path (stop() returns a blob: URL instead) and
    // path_provider has no web implementation, so don't touch it there.
    if (kIsWeb) return 'ppc_voice_${_seq++}.webm';
    final dir = await getTemporaryDirectory();
    return '${dir.path}/ppc_voice_${_seq++}.m4a';
  }

  static const RecordConfig _nativeConfig = RecordConfig(
    encoder: AudioEncoder.aacLc,
    sampleRate: 16000,
    numChannels: 1,
  );

  // record_web maps aacLc onto audio/mp4, which Chrome and Firefox's
  // MediaRecorder refuse; webm/opus is the format they all support and Whisper
  // accepts it (the React app uploads the same thing).
  static const RecordConfig _webConfig = RecordConfig(
    encoder: AudioEncoder.opus,
    sampleRate: 16000,
    numChannels: 1,
  );

  RecordConfig get _config => kIsWeb ? _webConfig : _nativeConfig;

  Future<VoiceClip?> _clipFor(String? path) async {
    if (path == null) return null;
    if (kIsWeb) {
      final Uint8List bytes;
      try {
        bytes = await readClipBytes(path);
      } catch (_) {
        return null; // blob went away; treat as a dropped clip
      }
      return VoiceClip(
        path: path,
        mime: 'audio/webm',
        filename: 'voice.webm',
        sizeBytes: bytes.length,
        bytes: bytes,
      );
    }
    var size = 0;
    try {
      size = File(path).lengthSync();
    } catch (_) {}
    return VoiceClip(
      path: path,
      mime: 'audio/m4a',
      filename: 'voice.m4a',
      sizeBytes: size,
    );
  }

  /// Record until the speaker goes quiet (or a hard cap), then return the clip.
  /// Returns null if nothing audible was captured (caller keeps listening).
  Future<VoiceClip?> recordUntilSilence() async {
    _cancelled = false;
    final path = await _newPath();
    await _rec.start(_config, path: path);
    _recording = true;

    final start = DateTime.now();
    var lastLoud = start;
    var spoke = false;
    final completer = Completer<VoiceClip?>();
    StreamSubscription<Amplitude>? sub;

    // Reading the clip is async on web, so `isCompleted` alone would let two
    // amplitude ticks both get past the guard and complete the completer twice.
    var finishing = false;
    Future<void> finish(bool keep) async {
      if (finishing || completer.isCompleted) return;
      finishing = true;
      await sub?.cancel();
      String? p;
      try {
        p = await _rec.stop();
      } catch (_) {}
      _recording = false;
      completer.complete(keep ? await _clipFor(p) : null);
    }

    sub = _rec.onAmplitudeChanged(_tick).listen((amp) {
      if (_cancelled) {
        finish(false);
        return;
      }
      final now = DateTime.now();
      if (amp.current > _loudDb) {
        spoke = true;
        lastLoud = now;
      }
      final sinceLoud = now.difference(lastLoud);
      final total = now.difference(start);
      if (spoke && sinceLoud > _silenceHold) {
        finish(true);
      } else if (total > _maxClip) {
        finish(spoke);
      } else if (!spoke && total > _noSpeechTimeout) {
        finish(false);
      }
    }, onError: (_) => finish(false));

    return completer.future;
  }

  /// Stop an in-progress recording early (e.g. the user ended voice mode).
  Future<void> cancelListening() async {
    _cancelled = true;
    if (_recording) {
      try {
        await _rec.stop();
      } catch (_) {}
      _recording = false;
    }
  }

  // ── playback ───────────────────────────────────────────────────────────────
  Future<bool> playBytes(Uint8List bytes) async {
    try {
      await _player.stop();
      await _player.play(BytesSource(bytes, mimeType: 'audio/mpeg'));
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Play and wait for completion — used by hands-free mode so listening only
  /// resumes after the assistant finishes speaking (mic never hears itself).
  Future<void> playBytesAwait(Uint8List bytes) async {
    final done = Completer<void>();
    StreamSubscription? sub;
    sub = _player.onPlayerComplete.listen((_) {
      sub?.cancel();
      if (!done.isCompleted) done.complete();
    });
    try {
      await _player.stop();
      await _player.play(BytesSource(bytes, mimeType: 'audio/mpeg'));
    } catch (_) {
      sub.cancel();
      if (!done.isCompleted) done.complete();
      return;
    }
    await done.future.timeout(const Duration(seconds: 30), onTimeout: () {
      sub?.cancel();
    });
  }

  Future<void> stopSpeaking() async {
    try {
      await _player.stop();
    } catch (_) {}
  }

  Future<void> dispose() async {
    try {
      await _rec.dispose();
    } catch (_) {}
    try {
      await _player.dispose();
    } catch (_) {}
  }
}
