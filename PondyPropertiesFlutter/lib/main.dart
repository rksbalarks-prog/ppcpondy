import 'package:clarity_flutter/clarity_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'assistant/assistant_client.dart';
import 'assistant/assistant_controller.dart';
import 'assistant/assistant_fab_slot.dart';
import 'assistant/assistant_strings.dart';
import 'assistant/assistant_widget.dart';
import 'core/theme.dart';
import 'routes.dart';
import 'services/clarity_route_observer.dart';
import 'services/clarity_service.dart';
import 'services/push_service.dart';
import 'state/session_provider.dart';
import 'widgets/common.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('en_IN');
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  final session = SessionProvider();
  await session.bootstrap();

  // One shared assistant client (it holds the session token) drives the
  // app-wide chat/voice overlay.
  final assistant = AssistantController(
    client: AssistantClient(),
    phoneProvider: () => session.phoneNumber ?? '',
    loginFirstMessage: AssistantT.en.loginFirst,
  );

  final root = PondyPropertiesApp(session: session, assistant: assistant);

  // Microsoft Clarity — session replays / heatmaps. ClarityWidget brings the
  // SDK up around the whole app. With no project ID configured the app is run
  // unwrapped and the SDK is never initialised at all.
  final clarityConfig = ClarityService.instance.config;
  runApp(
    clarityConfig == null
        ? root
        : ClarityWidget(app: root, clarityConfig: clarityConfig),
  );

  // Attach after the first frame: ClarityWidget has initialised the SDK by
  // then, so the identity tags land on a live session instead of being dropped.
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    ClarityService.instance.attach(session);

    // Bring up FCM AFTER the first frame so Firebase init / the permission
    // prompt / channel setup never delay initial paint. A safe no-op when
    // google-services.json isn't present yet.
    await PushService.instance.init();
    void syncPushRegistration() {
      if (session.isLoggedIn) {
        PushService.instance.registerFor(session.phoneDigits);
      } else {
        // Logged out — let the next login re-register this device.
        PushService.instance.reset();
      }
    }

    syncPushRegistration();
    // Re-run on login/logout. registerFor() dedupes, so the other
    // notifyListeners() calls (points/unread refresh) cost nothing.
    session.addListener(syncPushRegistration);
  });
}

class PondyPropertiesApp extends StatelessWidget {
  const PondyPropertiesApp({
    super.key,
    required this.session,
    required this.assistant,
  });

  final SessionProvider session;
  final AssistantController assistant;

  // Reports the current screen name to Clarity on every push/pop. Static so a
  // rebuild of this widget never swaps in a second observer.
  static final ClarityRouteObserver _clarityObserver = ClarityRouteObserver();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SessionProvider>.value(value: session),
        ChangeNotifierProvider<AssistantController>.value(value: assistant),
      ],
      child: MaterialApp(
        title: 'Pondy Property',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        // The assistant overlay sits above the Navigator, so it reaches routes
        // through this key rather than Navigator.of(context).
        navigatorKey: AssistantNav.navigatorKey,
        // Reports the current screen name to Clarity on every push/pop.
        navigatorObservers: [_clarityObserver],
        initialRoute: AppRoutes.splash,
        onGenerateRoute: AppRoutes.onGenerateRoute,
        // Every page is locked to the same 470px column the web app uses, so
        // tablets and the web build look identical to a phone. The AI assistant
        // (FAB + chat/voice panel) floats over every route on top of that.
        builder: (context, child) => PhoneFrame(
          child: Stack(
            textDirection: TextDirection.ltr,
            children: [
              child ?? const SizedBox.shrink(),
              // Positioned.fill, so the route below still decides the stack's
              // size and the assistant simply covers whatever that is.
              const Positioned.fill(child: AssistantWidget()),
            ],
          ),
        ),
      ),
    );
  }
}
