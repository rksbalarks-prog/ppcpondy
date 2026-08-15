import 'dart:typed_data';

/// Non-web half of the conditional import in `assistant_voice.dart`.
///
/// On Android/iOS `record` writes a real file and the clip is uploaded with
/// `MultipartFile.fromPath`, so this is never called — it exists only to keep
/// the web-only `package:web` interop out of mobile builds.
Future<Uint8List> readClipBytes(String url) {
  throw UnsupportedError('readClipBytes is web-only; mobile reads the file.');
}
