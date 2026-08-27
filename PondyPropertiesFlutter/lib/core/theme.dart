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

  // ── Detail / form page palette ──────────────────────────────────────────
  // Lifted from the inline styles in Details.jsx, AddProperty.jsx and
  // BuyerAssistance.jsx, which share one visual language: pale teal-tinted
  // tiles, an uppercase micro-label over a dark slate value, and a gradient
  // accent bar on every section heading.

  /// Headings and field values (#1F3A3F).
  static const Color ink = Color(0xFF1F3A3F);

  /// Tile fill and its resting border (#F6FAFB / #E3EEF0).
  static const Color tileBg = Color(0xFFF6FAFB);
  static const Color tileBorder = Color(0xFFE3EEF0);

  /// The round icon chip inside a tile (#E3F1F2 behind #2F747F).
  static const Color tileIconBg = Color(0xFFE3F1F2);

  /// Uppercase micro-label above a value (#7A8A91), and the italic grey a
  /// tile falls back to when it has no value (#A6B0B5).
  static const Color labelMuted = Color(0xFF7A8A91);
  static const Color valueEmpty = Color(0xFFA6B0B5);

  /// Price (#FF5722) and the italic "in words" line under it (#8B99A9).
  static const Color priceOrange = Color(0xFFFF5722);
  static const Color priceWords = Color(0xFF8B99A9);

  /// Negotiable / non-negotiable pills.
  static const Color negOkFg = Color(0xFF15803D);
  static const Color negOkBg = Color(0xFFDCFCE7);
  static const Color negNoFg = Color(0xFFB91C1C);
  static const Color negNoBg = Color(0xFFFEE2E2);

  /// Sticky detail header strip (#EFEFEF) and the gallery's arrow buttons
  /// (#019988).
  static const Color detailHeaderBg = Color(0xFFEFEFEF);
  static const Color galleryNav = Color(0xFF019988);

  /// Input border on the offer / form fields (#C6DFE3).
  static const Color fieldBorder = Color(0xFFC6DFE3);

  /// The brand gradient on pills and primary buttons
  /// (`linear-gradient(135deg,#2F747F,#3E8E96)`).
  static const List<Color> brandGradient = [
    Color(0xFF2F747F),
    Color(0xFF3E8E96),
  ];

  /// The vertical bar that prefixes every section heading
  /// (`linear-gradient(180deg,#30747F,#6EB7B2)`).
  static const List<Color> accentBarGradient = [
    Color(0xFF30747F),
    Color(0xFF6EB7B2),
  ];
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
