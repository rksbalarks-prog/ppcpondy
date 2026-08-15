import '../core/api_client.dart';
import '../core/formatters.dart';

/// Login / OTP flow — ports `Components/Login.jsx`.
///
/// Order of operations kept identical to the web app:
///   1. check `/user/direct-verified-users` for an admin "direct verify" bypass
///   2. otherwise `/send-otp`, then mirror the OTP over WhatsApp `/send-message`
///   3. `/verify-otp` to finish, then a success WhatsApp notification
class AuthService {
  AuthService._();

  static final _api = ApiClient.instance;

  /// True when an admin has pre-verified this number (skip OTP entirely).
  static Future<bool> isDirectVerified(String phoneDigits) async {
    try {
      final body = await _api.get('/user/direct-verified-users');
      final users = (body is Map ? body['users'] : null);
      if (users is! List) return false;
      final plain = Fmt.plainPhone(phoneDigits);
      return users.any((u) =>
          u is Map &&
          Fmt.plainPhone(u['phone']?.toString()) == plain &&
          u['directVerified'] == true);
    } catch (_) {
      // A failed check must fall back to the normal OTP flow, never block login.
      return false;
    }
  }

  /// Sends the OTP. Returns the OTP the server generated (the backend echoes it
  /// back in `result.otp` so the web client can relay it over WhatsApp).
  static Future<String?> sendOtp({
    required String fullPhoneNumber,
    required String countryCode,
    String loginMode = 'app',
    String? fcmToken,
  }) async {
    final body = await _api.post('/send-otp', data: {
      'phoneNumber': fullPhoneNumber,
      'loginMode': loginMode,
      'countryCode': countryCode,
      if (fcmToken != null) 'fcmToken': fcmToken,
    });
    final result = body is Map ? body['result'] : null;
    final otp = result is Map ? result['otp'] : null;
    return otp?.toString();
  }

  static Future<void> verifyOtp({
    required String fullPhoneNumber,
    required String otp,
    String? fcmToken,
  }) async {
    await _api.post('/verify-otp', data: {
      'phoneNumber': fullPhoneNumber,
      'otp': otp,
      if (fcmToken != null) 'fcmToken': fcmToken,
    });
  }

  /// WhatsApp relay used for OTP / login / logout notices. Delivery stays
  /// best-effort — it must never block login — but the caller gets to know
  /// whether it actually went out, so the OTP screen can stop promising a
  /// WhatsApp message the upstream provider rejected.
  static Future<bool> sendWhatsApp(String phone, String message) async {
    try {
      final to = Fmt.whatsAppNumber(phone);
      if (to.length < 12) return false;
      await _api.post('/send-message', data: {'to': to, 'message': message});
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<void> registerFcmToken(String phone, String token) async {
    try {
      await _api.post('/register-token', data: {
        'phoneNumber': phone,
        'fcmToken': token,
      });
    } catch (_) {}
  }

  /// Analytics ping fired on app open (MoblieViews.jsx).
  static Future<void> logAppOpen(String phoneDigits) async {
    try {
      await _api.post('/log-app-open', data: {'phoneNumber': phoneDigits});
    } catch (_) {}
  }

  /// Screen-view analytics (`record-views`), fired by most React screens.
  static Future<void> recordView(String? phone, String viewedFile) async {
    if (phone == null || phone.isEmpty) return;
    try {
      await _api.post('/record-views', data: {
        'phoneNumber': phone,
        'viewedFile': viewedFile,
        'viewTime': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (_) {}
  }

  // ── WhatsApp message templates (verbatim from Login.jsx / Navbar.jsx) ────

  static String otpMessage(String otp) => '''Hi there, 👋

Your OTP for Pondy property login is: $otp

⏱️ This OTP expires in 30 minutes.
🔒 Never share this OTP with anyone.

If you didn't request this OTP, please ignore this message.

– Team Pondy Property''';

  static const String loginSuccessMessage = '''Hi Owner, 👋
Welcome to Pondy Property! 🏡

✅ Login Successful

You can now add, manage, and promote your properties easily.
We're happy to have you with us!

– Team Pondy Property''';

  static const String failedOtpMessage = '''Hi Owner, 🔔

⚠️ Login Attempt Failed

We noticed an incorrect OTP was entered during login.

If this wasn't you, please secure your account immediately.

For assistance, contact our support team:
📞 +91-8300622013
📧 info.rentpondy@gmail.com

Stay secure!
– Team Pondy property''';

  static const String logoutMessage = '''Hi Owner, 👋

🔓 You've Been Logged Out

Your Pondy Property account has been logged out successfully.

If you didn't perform this action, please:
📞 Contact us: +91-8300622013
📧 Email: info.ppc@gmail.com

Stay safe and secure!

– Team Rent Pondy''';
}
