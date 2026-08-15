import 'dart:js_interop';
import 'dart:typed_data';

import 'package:web/web.dart' as web;

/// Web half of the conditional import in `assistant_voice.dart`.
///
/// `record_web` has no filesystem to write to: its `stop()` hands back a
/// `blob:` URL instead of a path. Fetch that URL to get the encoded audio,
/// which is used both for the silence check and for the /transcribe upload.
///
/// The blob is revoked once read — recordings are never replayed, and leaving
/// them attached would pin the audio in memory for the life of the tab.
Future<Uint8List> readClipBytes(String url) async {
  try {
    final res = await web.window.fetch(url.toJS).toDart;
    final buffer = await res.arrayBuffer().toDart;
    return buffer.toDart.asUint8List();
  } finally {
    web.URL.revokeObjectURL(url);
  }
}
