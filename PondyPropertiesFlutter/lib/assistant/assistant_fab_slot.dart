import 'package:flutter/material.dart';

/// Plumbing the app-wide assistant overlay needs, kept in this folder so the
/// integration stays additive.
///
/// [navigatorKey] lets the overlay push routes. The widget is mounted from
/// `MaterialApp.builder`, i.e. ABOVE the Navigator, so `Navigator.of(context)`
/// there would not find one — the key is the supported way to reach it.
class AssistantNav {
  const AssistantNav._();

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static NavigatorState? get nav => navigatorKey.currentState;
}

/// How far to lift the assistant FAB so it doesn't sit on top of another
/// floating button.
///
/// The assistant is mounted app-wide (MaterialApp.builder), so it can't see
/// which screen is below it. Screens that show their own FAB publish the extra
/// clearance they need here; everything else leaves it at 0 and the assistant
/// keeps its default position.
class AssistantFabSlot {
  const AssistantFabSlot._();

  static final ValueNotifier<double> extraBottom = ValueNotifier<double>(0);

  /// Default distance from the bottom of the window.
  ///
  /// AppBottomNav is 100px tall (`_totalHeight`), so 116 clears it with a 16px
  /// gap on the tabbed shell — and on pushed pages it also sits above the
  /// extended FABs that My Property / My Buyer Assistance show (those top out
  /// around 64px).
  static const double defaultBottom = 116;

  static void set(double value) {
    if (extraBottom.value != value) extraBottom.value = value;
  }
}
