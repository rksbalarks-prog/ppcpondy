import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../assistant/assistant_fab_slot.dart'; // AssistantNav.navigatorKey
import '../core/api_client.dart';
import '../routes.dart';

/// Background / terminated message handler.
///
/// Must be a top-level function marked as a VM entry point — FCM spins up a
/// separate isolate to run it, so it can't be a class method or a closure.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // The OS already displays the notification when a message carries a
  // `notification` block, so there's nothing to do here for the common case.
  // Any heavy lifting (e.g. data sync) would go here.
  await Firebase.initializeApp();
}

/// Firebase Cloud Messaging integration for the app.
///
/// Designed to degrade gracefully: if `Firebase.initializeApp()` fails (e.g.
/// no `google-services.json` yet), [available] stays false and every method is
/// a safe no-op, so the rest of the app is unaffected. Push becomes live the
/// moment the Firebase config is added — no code change needed.
///
/// Backend counterpart: PPC/fcm/ (POST /register-fcm-token, /push-send).
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  /// Must match ANDROID_CHANNEL in PPC/fcm/sendPush.js, or Android 8+ drops
  /// the notification's high importance.
  static const _channel = AndroidNotificationChannel(
    'ppcpondy_default',
    'Pondy Property Notifications',
    description: 'Property alerts, interests, offers and updates.',
    importance: Importance.high,
  );

  final ApiClient _api = ApiClient.instance;
  bool _available = false;
  bool _initialised = false;

  bool get available => _available;

  /// Call once at startup. Safe to call even if Firebase isn't configured.
  Future<void> init() async {
    if (_initialised) return;
    _initialised = true;

    try {
      await Firebase.initializeApp();
      _available = true;
    } catch (e) {
      // No google-services.json / not configured yet — push stays inert.
      debugPrint('PushService: Firebase not configured, push disabled ($e)');
      return;
    }

    await _initLocalNotifications();

    // Foreground: FCM does NOT show a banner on Android, so we display one
    // via flutter_local_notifications.
    FirebaseMessaging.onMessage.listen(_showLocal);

    // Tapped while backgrounded, and while terminated.
    FirebaseMessaging.onMessageOpenedApp.listen(_handleTap);
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) _handleTap(initial);

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Re-register whenever the token rotates.
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      if (_lastPhone != null) _sendToken(_lastPhone!, token);
    });

    // Ask for the notification permission and fetch the token up-front, so the
    // OS prompt appears on first launch (not only after login) and the token is
    // ready immediately. Backend registration still waits for a phone number.
    await _primeToken();
  }

  /// Request permission + fetch the token at startup (independent of login).
  Future<void> _primeToken() async {
    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && kDebugMode) debugPrint('FCM_TOKEN=$token');
    } catch (e) {
      debugPrint('PushService: primeToken failed ($e)');
    }
  }

  Future<void> _initLocalNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _local.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) _routeTo(payload);
      },
    );
    await _local
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  String? _lastPhone;
  String? _registeredPhone;
  bool _registering = false;

  /// Ask for permission (Android 13+, iOS) and register the token for [phone].
  /// No-op when Firebase isn't configured. Deduped so a SessionProvider
  /// listener (which fires on every points/unread refresh) doesn't
  /// re-register on every rebuild.
  Future<void> registerFor(String phone) async {
    if (!_available || phone.isEmpty) return;
    if (_registering || _registeredPhone == phone) return;
    _registering = true;
    _lastPhone = phone;
    try {
      await FirebaseMessaging.instance.requestPermission();
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        // Printed so it can be pasted into Firebase console → Cloud Messaging
        // → "Send test message" to verify delivery without the backend.
        if (kDebugMode) debugPrint('FCM_TOKEN=$token');
        await _sendToken(phone, token);
        _registeredPhone = phone;
      }
    } catch (e) {
      debugPrint('PushService: token registration failed ($e)');
    } finally {
      _registering = false;
    }
  }

  /// Clear the registered-phone guard on logout so the next login re-registers.
  void reset() => _registeredPhone = null;

  Future<void> _sendToken(String phone, String token) async {
    try {
      await _api.post('/register-fcm-token', data: {
        'phoneNumber': phone,
        'token': token,
        'platform': defaultTargetPlatform.name,
      });
    } catch (e) {
      debugPrint('PushService: backend token register failed ($e)');
    }
  }

  /// Foreground banner for an incoming message.
  Future<void> _showLocal(RemoteMessage message) async {
    final n = message.notification;
    final title = n?.title ?? message.data['title'] ?? 'Pondy Property';
    final body = n?.body ?? message.data['body'] ?? '';
    if (body.isEmpty && n == null) return;

    await _local.show(
      message.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: _routeFromData(message.data),
    );
  }

  void _handleTap(RemoteMessage message) {
    final route = _routeFromData(message.data);
    if (route != null) _routeTo(route);
  }

  /// Pull a destination route out of the message payload, defaulting to the
  /// in-app notifications list. A bare `ppcId` is encoded as
  /// `/details/<id>` here and split apart again in [_routeTo] — the app's
  /// detail route takes the id as a route ARGUMENT, not a path segment.
  String? _routeFromData(Map<String, dynamic> data) {
    final route = data['route']?.toString();
    if (route != null && route.isNotEmpty) return route;
    final ppcId = data['ppcId']?.toString();
    if (ppcId != null && ppcId.isNotEmpty) {
      return '${AppRoutes.propertyDetail}/$ppcId';
    }
    return AppRoutes.notifications;
  }

  void _routeTo(String route) {
    final nav = AssistantNav.navigatorKey.currentState;
    if (nav == null) return;

    // Property deep-link: '/details/12345' -> pushNamed('/details', args: id).
    const detailPrefix = '${AppRoutes.propertyDetail}/';
    if (route.startsWith(detailPrefix)) {
      final ppcId = route.substring(detailPrefix.length);
      if (ppcId.isNotEmpty) {
        nav.pushNamed(AppRoutes.propertyDetail, arguments: ppcId);
        return;
      }
    }

    // A route typed by an admin may not exist in the app; onGenerateRoute
    // returns null for those and pushNamed would assert. Fall back to the
    // notifications list rather than crashing on a tapped notification.
    try {
      nav.pushNamed(route);
    } catch (e) {
      debugPrint('PushService: unknown route "$route" ($e)');
      nav.pushNamed(AppRoutes.notifications);
    }
  }
}
