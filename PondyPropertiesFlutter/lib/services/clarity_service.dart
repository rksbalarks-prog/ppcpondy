import 'package:clarity_flutter/clarity_flutter.dart';
import 'package:flutter/foundation.dart';

import '../core/clarity_settings.dart';
import '../state/session_provider.dart';

/// Microsoft Clarity — session replays, heatmaps and tap analytics for the
/// mobile app. Mirrors what `src/utils/clarity.js` does in the web app so the
/// two dashboards use the same identity and the same tag names.
///
/// Everything is wrapped in [_guard]: analytics must never be able to crash the
/// app, and the SDK throws if a call lands before it has initialised.
///
///  - Inert without a project ID — see [ClaritySettings].
class ClarityService {
  ClarityService._();

  static final ClarityService instance = ClarityService._();

  SessionProvider? _session;
  bool _attached = false;
  String? _lastIdentifiedPhone;

  bool get enabled => ClaritySettings.enabled;

  /// Config handed to [ClarityWidget] in main.dart. Null when disabled.
  ///
  /// logLevel only matters in debug builds — the SDK forces it to None in
  /// release, so there is no production logging overhead either way.
  ClarityConfig? get config {
    if (!enabled) return null;
    return ClarityConfig(
      projectId: ClaritySettings.projectId,
      logLevel: kDebugMode ? LogLevel.Verbose : LogLevel.None,
    );
  }

  /// Wire Clarity to the app's session state.
  ///
  /// Call once from main(), after [SessionProvider.bootstrap]. Identity is
  /// applied twice over: once when a Clarity session starts (the SDK's
  /// recommended hook, so the tags attach to the right session) and again
  /// whenever the session changes, which covers login, logout and a city
  /// switch mid-session.
  void attach(SessionProvider session) {
    if (!enabled || _attached) return;
    _attached = true;
    _session = session;

    _guard(() => Clarity.setOnSessionStartedCallback((_) => _apply()));
    session.addListener(_onSessionChanged);
    _onSessionChanged();
  }

  void _onSessionChanged() {
    final phone = _session?.phoneDigits ?? '';

    // A different person signed in on this device. Cut a fresh Clarity session
    // rather than letting the previous user's recording absorb their activity —
    // the web app hit exactly this problem, where a leftover login kept
    // reporting the wrong number for the whole session.
    final changedUser =
        _lastIdentifiedPhone != null && _lastIdentifiedPhone != phone;

    if (changedUser) {
      _guard(() => Clarity.startNewSession((_) => _apply()));
      return;
    }

    _apply();
  }

  /// Push the current identity + tags into the live Clarity session.
  void _apply() {
    final session = _session;
    if (session == null) return;

    final phone = session.phoneDigits;
    _lastIdentifiedPhone = phone;

    if (phone.isNotEmpty) {
      // Matches the web app's identity so a session here and a session on
      // ppcpondy.com line up to the same person.
      //
      // NOTE: Microsoft advises against putting PII in this field. Swapping to
      // a hash (or an internal user id) is a one-line change here and nothing
      // else needs to move — the trade-off is that you would then have to map
      // it back through your own database instead of reading it off the
      // Clarity dashboard.
      _guard(() => Clarity.setCustomUserId(phone));
      _guard(() => Clarity.setCustomTag('user_phone', phone));
    }

    _guard(() => Clarity.setCustomTag('logged_in', phone.isEmpty ? 'guest' : 'yes'));
    _guard(() => Clarity.setCustomTag('city', session.activeBase));
    _guard(() => Clarity.setCustomTag('platform', defaultTargetPlatform.name));
  }

  /// Name the screen the user is on. Clarity starts a new "page" each time this
  /// changes, which is what makes per-screen heatmaps and page filters work.
  /// Driven by ClarityRouteObserver — you rarely need to call it by hand.
  void setScreen(String? name) {
    if (!enabled) return;
    _guard(() => Clarity.setCurrentScreenName(name));
  }

  /// Record a named action (becomes a filterable event in the dashboard).
  void event(String name) {
    if (!enabled || name.isEmpty) return;
    _guard(() => Clarity.sendCustomEvent(name));
  }

  /// Deep link to the current session's recording — handy to attach to a bug
  /// report. Null until a session has actually started.
  ///
  /// (The Flutter SDK has no equivalent of the web tag's `upgrade` call, so
  /// there is no way to exempt a session from sampling from here.)
  String? get currentSessionUrl {
    if (!enabled) return null;
    try {
      return Clarity.getCurrentSessionUrl();
    } catch (_) {
      return null;
    }
  }

  /// Every SDK call goes through here: analytics must never crash the app, and
  /// the SDK throws when a call lands before it has initialised.
  void _guard(void Function() action) {
    try {
      action();
    } catch (e) {
      if (kDebugMode) debugPrint('[clarity] ignored: $e');
    }
  }
}
