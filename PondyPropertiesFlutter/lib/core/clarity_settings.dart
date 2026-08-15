/// Microsoft Clarity configuration for the mobile app.
///
/// Clarity keeps mobile and web projects apart and will not accept mobile SDK
/// data on a web project ID, so Pondy Properties runs two:
///
///   y177ztikbz  user site  (web)     — Pondy Properties USER/.env
///   y178mj1880  this app   (mobile)  ← configured below
///
/// (RentPondy is a separate product with its own three projects; nothing here
/// should ever point at one of those.)
///
/// Leave [projectId] empty to switch Clarity off completely — the SDK is never
/// initialised, no session is captured and every helper in ClarityService
/// becomes a no-op. Useful for local development so test taps never land in
/// production data.
///
/// Named ClaritySettings rather than ClarityConfig because the SDK already
/// exports a class by that name.
class ClaritySettings {
  ClaritySettings._();

  /// Clarity mobile project ID. Empty string disables Clarity entirely.
  static const String projectId = 'y178mj1880';

  static bool get enabled => projectId.isNotEmpty;
}
