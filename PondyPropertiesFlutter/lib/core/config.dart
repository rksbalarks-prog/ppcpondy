/// App-wide configuration.
///
/// These mirror the React app's `.env`:
///   REACT_APP_API_URL=https://ppcpondy.com/PPC/PPC
///
/// The Flutter app talks to exactly the same backend / database, so nothing
/// here should diverge from the web values.
class AppConfig {
  AppConfig._();

  /// Backend API root (same as REACT_APP_API_URL).
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://ppcpondy.com/PPC/PPC',
  );

  /// Static file host. The backend stores photo/video paths relative to this
  /// root, and the web app builds URLs as `https://ppcpondy.com/PPC/<path>`.
  static const String fileHost = String.fromEnvironment(
    'FILE_HOST',
    defaultValue: 'https://ppcpondy.com/PPC',
  );

  /// Public web app root. Shared links must point at the React routes
  /// (`https://ppcpondy.com/details/123`), NOT under the `/PPC` file host —
  /// that path serves uploads and 404s for a listing URL.
  static const String siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://ppcpondy.com',
  );

  /// AI assistant backend (same value as the web REACT_APP_ASSISTANT_URL).
  /// Note this sits at the node root, NOT under the `/PPC` express prefix that
  /// [apiUrl] uses — see PPC/assistant/index.js (`app.use('/api/assistant', ...)`).
  static const String assistantUrl = String.fromEnvironment(
    'ASSISTANT_URL',
    defaultValue: 'https://ppcpondy.com/PPC/api/assistant',
  );

  static const String appVersion = '1.0.0';

  /// PayU hosted checkout endpoint (same as the web PayUForm action).
  static const String payuAction = 'https://secure.payu.in/_payment';

  /// Support contacts used across the app (from the web WhatsApp templates).
  static const String supportPhone = '+918300622013';
  static const String supportEmail = 'info.ppc@gmail.com';

  /// Play Store links used by the sidebar "More App" / "Share App" entries.
  static const String devPlayStoreUrl =
      'https://play.google.com/store/apps/dev?id=5743868169001839900&hl=en';

  /// Sibling "Rent" apps the login screen can hand off to.
  static const Map<String, String> rentUrls = {
    'pondicherry': 'https://rentpondy.com/',
    'chennai': 'https://rentchennai.com/',
  };
}
