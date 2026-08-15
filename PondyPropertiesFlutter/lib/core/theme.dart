import 'package:flutter/material.dart';

/// Design tokens lifted straight from the React app's inline styles so the
/// Flutter UI matches pixel-for-pixel where it matters.
class AppColors {
  AppColors._();

  /// Primary teal — navbar icons, sidebar header, section headings (#30747F).
  static const Color teal = Color(0xFF30747F);

  /// Slightly different teal used for prices / active top-bar labels (#2F747F).
  static const Color tealDark = Color(0xFF2F747F);

  /// Muted teal used for buttons and outlines in the search modals (#6EB7B2).
  static const Color tealSoft = Color(0xFF6EB7B2);

  /// Login / primary CTA colour.
  static const Color orangeRed = Color(0xFFFF4500);

  /// City switcher bar + menu headings (#4F4B7E / #4B3F72).
  static const Color indigo = Color(0xFF4F4B7E);
  static const Color indigoDeep = Color(0xFF4B3F72);

  /// Card + page backgrounds.
  static const Color pageBg = Color(0xFFE5E5E5);
  static const Color cardBg = Color(0xFFF9F9F9);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color chipBg = Color(0xFFF5F5F5);

  /// Text.
  static const Color text = Color(0xFF000000);
  static const Color textMuted = Color(0xFF5E5E5E);
  static const Color textFaint = Color(0xFF888888);

  /// "On Demand" price colour.
  static const Color onDemand = Color(0xFF8C3C2F);

  /// Clicked / visited card title colour.
  static const Color visited = Color(0xFFF76F00);

  /// Featured ribbon gradient.
  static const List<Color> featuredGradient = [
    Color(0xE8FFC800),
    Color(0xFFFBB606),
  ];

  /// Points pill gradient (navbar).
  static const List<Color> pointsGradient = [
    Color(0xFF3F2C7E),
    Color(0xFF5B3F90),
    Color(0xFF9D5CFF),
  ];

  static const List<Color> coinGradient = [
    Color(0xFFFFE9B3),
    Color(0xFFFFC857),
    Color(0xFFFF7A45),
  ];

  /// Search field styling on the feed.
  static const Color searchBorder = Color(0xFFB7DCDE);
  static const Color searchTop = Color(0xFFF6FBFB);
  static const Color searchBottom = Color(0xFFEAF5F5);
}

/// The web app is locked to a 470px-wide column; we reuse that as the max
/// content width so tablets/desktop web builds look the same.
const double kMaxContentWidth = 470;

ThemeData buildAppTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.teal,
      primary: AppColors.teal,
      surface: AppColors.surface,
    ),
    scaffoldBackgroundColor: AppColors.surface,
    fontFamily: 'Roboto', // Inter's closest always-available stand-in
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFFF8F9FA), // bootstrap bg-light
      foregroundColor: AppColors.teal,
      elevation: 0,
      centerTitle: true,
    ),
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
    ),
    dividerTheme: const DividerThemeData(color: Color(0xFFEEEEEE), thickness: 1),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.tealSoft,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      isDense: true,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFDDDDDD)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFDDDDDD)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.tealSoft, width: 1.5),
      ),
      labelStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
      hintStyle: const TextStyle(fontSize: 13, color: AppColors.textFaint),
    ),
  );
}
