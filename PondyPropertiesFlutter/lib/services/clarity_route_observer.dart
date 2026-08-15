import 'package:flutter/material.dart';

import 'clarity_service.dart';

/// Tells Microsoft Clarity which screen the user is on.
///
/// The Flutter counterpart of the web app's `ClarityTracker.jsx`. Clarity
/// starts a new "page" whenever the screen name changes, so without this the
/// entire app would be recorded as one endless screen and per-screen heatmaps
/// would be impossible.
///
/// Screen names come from `RouteSettings.name`. `AppRoutes.onGenerateRoute`
/// passes `settings` straight through to the MaterialPageRoute, so every
/// navigated screen reports the route path it was pushed with. Routes pushed
/// directly with a bare `MaterialPageRoute` have no name; those fall back to
/// the route's own type rather than reporting nothing, which at least keeps the
/// screen boundary visible in the recording.
class ClarityRouteObserver extends NavigatorObserver {
  ClarityRouteObserver();

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _report(route);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    // Popping returns the user to whatever was underneath.
    _report(previousRoute);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    _report(newRoute);
  }

  void _report(Route<dynamic>? route) {
    if (route == null) return;
    final name = _nameFor(route);
    if (name != null) ClarityService.instance.setScreen(name);
  }

  String? _nameFor(Route<dynamic> route) {
    final name = route.settings.name;
    if (name != null && name.trim().isNotEmpty) return name;

    // Unnamed route (a bare MaterialPageRoute pushed from a screen). Dialogs
    // and other popups are not screens — skip them so they don't split the
    // recording into meaningless pages.
    if (route is PageRoute) return route.runtimeType.toString();
    return null;
  }
}
