import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/formatters.dart';
import '../core/theme.dart';
import '../routes.dart';
import '../state/session_provider.dart';

/// The 60px top bar from Navbar.jsx: hamburger, animated "PondyProperty"
/// brand, points pill and the notification bell with its unread dot.
class AppNavbar extends StatelessWidget implements PreferredSizeWidget {
  const AppNavbar({super.key, this.onMenuTap});

  final VoidCallback? onMenuTap;

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();
    final brandCity = session.activeBase == 'CH' ? 'Chennai' : 'Pondy';

    return Material(
      color: const Color(0xFFF8F9FA),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 60,
          child: Row(
            children: [
              IconButton(
                onPressed: onMenuTap ?? () => Scaffold.of(context).openDrawer(),
                icon: const Icon(Icons.menu, size: 30),
                color: AppColors.teal,
                tooltip: 'Open menu',
              ),
              Expanded(child: _AnimatedBrand(city: brandCity)),
              _PointsPill(balance: session.pointsBalance),
              _bell(context, session),
              const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _bell(BuildContext context, SessionProvider session) {
    return Stack(
      alignment: Alignment.center,
      children: [
        IconButton(
          tooltip: 'Notifications',
          onPressed: () {
            session.clearUnreadBadge();
            Navigator.pushNamed(context, AppRoutes.notifications);
          },
          icon: const Icon(Icons.notifications_none_rounded, size: 24),
          color: AppColors.teal,
        ),
        if (session.unreadNotifications > 0)
          const Positioned(
            top: 8,
            right: 8,
            child: CircleAvatar(radius: 5, backgroundColor: Colors.red),
          ),
      ],
    );
  }
}

/// The navbar points pill, carrying the four keyframe animations Navbar.jsx
/// runs on it plus its hover/press transitions:
///
///   pillAura      4s   ease-in-out — the halo cycles purple → gold → purple
///   pillCoinPulse 2.4s ease-out    — a ring swells out of the coin and fades
///   pillSpin      6s   linear      — the coin flips on its Y axis
///   pillFloat     3s   ease-in-out — the coin bobs 2px
///   :hover        .18s ease        — lift 1px, scale 1.05, brighten
///   :active                        — scale 0.97
///
/// The CSS periods are full round trips, so the two `reverse: true` controllers
/// run at half their stated duration.
class _PointsPill extends StatefulWidget {
  const _PointsPill({required this.balance});

  final num? balance;

  @override
  State<_PointsPill> createState() => _PointsPillState();
}

class _PointsPillState extends State<_PointsPill> with TickerProviderStateMixin {
  static const Color _auraPurple = Color(0xFF9D5CFF);
  static const Color _auraGold = Color(0xFFFFC857);

  /// Fraction of pillCoinPulse spent expanding — after this the ring is
  /// fully transparent and simply waits out the cycle (the CSS 70% stop).
  static const double _pulseSpan = 0.7;

  late final AnimationController _aura;
  late final AnimationController _coinPulse;
  late final AnimationController _spin;
  late final AnimationController _float;

  bool _hovering = false;
  bool _pressed = false;

  @override
  void initState() {
    super.initState();
    _aura = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000), // 4s round trip
    )..repeat(reverse: true);
    _coinPulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
    _spin = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 6000),
    )..repeat();
    _float = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500), // 3s round trip
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _aura.dispose();
    _coinPulse.dispose();
    _spin.dispose();
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scale = _pressed ? 0.97 : (_hovering ? 1.05 : 1.0);
    final lift = _pressed ? 0.0 : (_hovering ? -1.0 : 0.0);

    return Tooltip(
      message: 'View points history',
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hovering = true),
        onExit: (_) => setState(() => _hovering = false),
        child: GestureDetector(
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          onTap: () => Navigator.pushNamed(context, AppRoutes.pointsHistory),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.ease,
            transformAlignment: Alignment.center,
            transform: Matrix4.identity()
              ..translateByDouble(0, lift, 0, 1)
              ..scaleByDouble(scale, scale, 1, 1),
            child: _aurora(child: _pill()),
          ),
        ),
      ),
    );
  }

  /// pillAura — the halo behind the pill, cycling purple → gold.
  Widget _aurora({required Widget child}) {
    return AnimatedBuilder(
      animation: _aura,
      builder: (context, inner) {
        final t = Curves.easeInOut.transform(_aura.value);
        final color = Color.lerp(_auraPurple, _auraGold, t)!;
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              // 0 0 0 1px — the tight rim.
              BoxShadow(
                color: color.withValues(alpha: 0.45 + 0.10 * t),
                spreadRadius: 1,
              ),
              // 0 6px 22px — the soft drop.
              BoxShadow(
                color: color.withValues(alpha: 0.40 + 0.05 * t),
                blurRadius: 22,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: inner,
        );
      },
      child: child,
    );
  }

  Widget _pill() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.ease,
      padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: AppColors.pointsGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white24),
      ),
      // Stands in for the hover `filter: brightness(1.07)`.
      foregroundDecoration: BoxDecoration(
        color: Colors.white.withValues(alpha: _hovering && !_pressed ? 0.07 : 0),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _coin(),
          const SizedBox(width: 7),
          Text(
            Fmt.points(widget.balance),
            style: const TextStyle(
              color: Color(0xFFFFF3D6),
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
          const Text(
            ' pts',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  /// The coin: pillCoinPulse on the disc, pillFloat + pillSpin on the glyph.
  Widget _coin() {
    return AnimatedBuilder(
      animation: Listenable.merge([_coinPulse, _spin, _float]),
      builder: (context, _) {
        // Ring swells to 10px while fading out, then idles until the cycle ends.
        final progress =
            Curves.easeOut.transform((_coinPulse.value / _pulseSpan).clamp(0.0, 1.0));
        final bob = -2.0 * Curves.easeInOut.transform(_float.value);

        return Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: AppColors.coinGradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white38, width: 1.5),
            boxShadow: [
              const BoxShadow(
                color: Color(0x8CFFC857), // 0 4px 14px rgba(255,200,87,.55)
                blurRadius: 14,
                offset: Offset(0, 4),
              ),
              BoxShadow(
                color: _auraGold.withValues(alpha: 0.55 * (1 - progress)),
                spreadRadius: 10 * progress,
              ),
            ],
          ),
          alignment: Alignment.center,
          child: Transform.translate(
            offset: Offset(0, bob),
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001) // perspective, so the flip reads as 3D
                ..rotateY(_spin.value * 2 * math.pi),
              child: const Text('🪙', style: TextStyle(fontSize: 13)),
            ),
          ),
        );
      },
    );
  }
}

/// One stop of a CSS `@keyframes` track: the percentage and the value there.
class _Kf {
  const _Kf(this.stop, this.value);

  final double stop; // 0..1, the keyframe percentage
  final double value;
}

/// Samples a keyframe track at [t].
///
/// CSS applies the animation's timing function to *each* leg between two
/// keyframes rather than once across the whole run, so every segment gets its
/// own `ease` — that is what makes the roof snap open and then coast.
double _sample(List<_Kf> track, double t) {
  for (var i = 0; i < track.length - 1; i++) {
    final a = track[i];
    final b = track[i + 1];
    if (t <= b.stop) {
      final span = b.stop - a.stop;
      final local = span <= 0 ? 1.0 : ((t - a.stop) / span).clamp(0.0, 1.0);
      return a.value + (b.value - a.value) * Curves.ease.transform(local);
    }
  }
  return track.last.value;
}

/// The animated brand from the web navbar — a direct port of Navbar.css's
/// `.navbar-intro-container` → `.house` → `.roof` + `.title` block:
///
///   drawRoof    4s ease infinite, delay 0s    — the roof line wipes out to 150px
///   slideLeft   3s ease infinite, delay 1.2s  — the city word flies in from -80px
///   slideRight  3s ease infinite, delay 2.4s  — "Property" flies in from +80px
///   finalGlow  25s ease infinite, delay 0s    — the title breathes 0.85 → 1.02
///
/// The four periods (4s / 3s / 3s / 25s) never line up, so on the web they
/// drift against each other indefinitely. Keeping them on four independent
/// controllers reproduces that drift instead of locking them to one clock.
class _AnimatedBrand extends StatefulWidget {
  const _AnimatedBrand({required this.city});

  /// "Pondy" or "Chennai" — Navbar.jsx's `brandCity`, which follows the base.
  final String city;

  @override
  State<_AnimatedBrand> createState() => _AnimatedBrandState();
}

class _AnimatedBrandState extends State<_AnimatedBrand>
    with TickerProviderStateMixin {
  /// `.roof` background and `.title` colour (#212529).
  static const Color _ink = Color(0xFF212529);

  /// `.rent { color: blue !important }` — the CSS keyword, i.e. pure #0000FF.
  static const Color _cityBlue = Color(0xFF0000FF);

  /// drawRoof's open width, and the ±80px travel of the two slide keyframes.
  static const double _roofWidth = 150;
  static const double _slide = 80;

  static const List<_Kf> _roofWidthTrack = [
    _Kf(0.00, 0),
    _Kf(0.08, 0),
    _Kf(0.18, _roofWidth),
    _Kf(0.92, _roofWidth),
    _Kf(1.00, 0),
  ];
  static const List<_Kf> _roofOpacityTrack = [
    _Kf(0.00, 0),
    _Kf(0.08, 1),
    _Kf(0.18, 1),
    _Kf(0.92, 1),
    _Kf(1.00, 0),
  ];

  static const List<_Kf> _cityXTrack = [
    _Kf(0.00, -_slide),
    _Kf(0.12, 0),
    _Kf(0.88, 0),
    _Kf(1.00, -_slide),
  ];
  static const List<_Kf> _cityOpacityTrack = [
    _Kf(0.00, 0),
    _Kf(0.12, 1),
    _Kf(0.88, 1),
    _Kf(1.00, 0),
  ];

  // slideRight reaches full opacity at 15%, a touch later than slideLeft's 12%.
  static const List<_Kf> _propertyXTrack = [
    _Kf(0.00, _slide),
    _Kf(0.15, 0),
    _Kf(0.88, 0),
    _Kf(1.00, _slide),
  ];
  static const List<_Kf> _propertyOpacityTrack = [
    _Kf(0.00, 0),
    _Kf(0.15, 1),
    _Kf(0.88, 1),
    _Kf(1.00, 0),
  ];

  static const List<_Kf> _glowScaleTrack = [
    _Kf(0.00, 0.85),
    _Kf(0.18, 0.85),
    _Kf(0.28, 1.00),
    _Kf(0.38, 1.02),
    _Kf(0.92, 1.00),
    _Kf(1.00, 0.85),
  ];
  static const List<_Kf> _glowBlurTrack = [
    _Kf(0.00, 0),
    _Kf(0.18, 0),
    _Kf(0.28, 15),
    _Kf(0.38, 20),
    _Kf(0.92, 15),
    _Kf(1.00, 0),
  ];
  static const List<_Kf> _glowAlphaTrack = [
    _Kf(0.00, 0),
    _Kf(0.18, 0),
    _Kf(0.28, 0.15),
    _Kf(0.38, 0.25),
    _Kf(0.92, 0.15),
    _Kf(1.00, 0),
  ];

  late final AnimationController _roof;
  late final AnimationController _cityWord;
  late final AnimationController _propertyWord;
  late final AnimationController _glow;

  @override
  void initState() {
    super.initState();
    _roof = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
    )..repeat();
    _glow = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 25000),
    )..repeat();
    _cityWord = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );
    _propertyWord = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    // `animation-delay` only offsets the first run; afterwards each controller
    // free-runs on its own period, so the two words stay 1.2s apart forever.
    _startAfter(_cityWord, const Duration(milliseconds: 1200));
    _startAfter(_propertyWord, const Duration(milliseconds: 2400));
  }

  void _startAfter(AnimationController controller, Duration delay) {
    Future<void>.delayed(delay, () {
      if (mounted) controller.repeat();
    });
  }

  @override
  void dispose() {
    _roof.dispose();
    _cityWord.dispose();
    _propertyWord.dispose();
    _glow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // `.title { font-size: 20px }`, stepped down by the 360px media query.
    final fontSize = MediaQuery.sizeOf(context).width <= 360 ? 17.0 : 20.0;

    // `.navbar-intro-container { pointer-events: none }` — taps fall through.
    return IgnorePointer(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _roofLine(),
            const SizedBox(height: 15), // .roof { margin: 0 auto 15px }
            _title(fontSize),
          ],
        ),
      ),
    );
  }

  Widget _roofLine() {
    return AnimatedBuilder(
      animation: _roof,
      builder: (context, _) {
        final t = _roof.value;
        return Opacity(
          opacity: _sample(_roofOpacityTrack, t).clamp(0.0, 1.0),
          child: Container(
            width: _sample(_roofWidthTrack, t),
            height: 3, // .roof { height: 3px }
            color: _ink,
          ),
        );
      },
    );
  }

  Widget _title(double fontSize) {
    return AnimatedBuilder(
      animation: _glow,
      builder: (context, _) {
        final t = _glow.value;
        // finalGlow's `text-shadow: 0 0 Npx rgba(0,0,0,a)`.
        final base = TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w700, // .title { font-weight: 700 }
          height: 1.2,
          shadows: [
            Shadow(
              color: Colors.black.withValues(
                alpha: _sample(_glowAlphaTrack, t).clamp(0.0, 1.0),
              ),
              blurRadius: _sample(_glowBlurTrack, t),
            ),
          ],
        );

        return Transform.scale(
          scale: _sample(_glowScaleTrack, t),
          // The words only ever translate, so the row's laid-out size is
          // constant and this scale factor stays put while they fly.
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _word(
                  widget.city,
                  _cityWord,
                  _cityXTrack,
                  _cityOpacityTrack,
                  base.copyWith(color: _cityBlue),
                ),
                const SizedBox(width: 8), // .title { gap: 8px }
                _word(
                  'Property',
                  _propertyWord,
                  _propertyXTrack,
                  _propertyOpacityTrack,
                  base.copyWith(color: _ink),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _word(
    String text,
    AnimationController controller,
    List<_Kf> xTrack,
    List<_Kf> opacityTrack,
    TextStyle style,
  ) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final t = controller.value;
        return Opacity(
          opacity: _sample(opacityTrack, t).clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(_sample(xTrack, t), 0),
            child: Text(text, style: style, maxLines: 1, softWrap: false),
          ),
        );
      },
    );
  }
}
