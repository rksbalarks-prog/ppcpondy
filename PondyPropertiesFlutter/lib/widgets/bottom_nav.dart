import 'dart:async';

import 'package:flutter/material.dart';

import '../core/theme.dart';

/// BottomNavigation.jsx — four tabs plus the animated floating "Add Property"
/// button in the middle.
///
/// The web version runs an 11-second loop: the logo sits in the circle for 4s,
/// then the button lifts and turns green with an "Add Property" label for 4s,
/// then settles back. Reproduced here with a repeating timer.
///
/// The web paints the bar from a pre-rendered PNG that has the notch baked in
/// (`bottomimg.png`, stretched with `background-size: cover`). That only lines
/// up at the one width the PNG was drawn for — at any other size the notch
/// drifts away from the button and its cut edges show as stray white shoulders.
/// Here the bar is drawn instead, so the notch is generated from the button's
/// own rect and tracks it exactly, at any width and through the lift.
class AppBottomNav extends StatefulWidget {
  const AppBottomNav({
    super.key,
    required this.activeId,
    required this.onSelect,
  });

  final String activeId;
  final ValueChanged<String> onSelect;

  static const String home = 'bottomHome';
  static const String property = 'bottomProperty';
  static const String add = 'bottomAdd';
  static const String buyer = 'bottomBuyer';
  static const String more = 'bottomMore';

  @override
  State<AppBottomNav> createState() => _AppBottomNavState();
}

class _AppBottomNavState extends State<AppBottomNav> {
  /// Diameter of the floating button (70px, as on the web).
  static const double _buttonSize = 70;

  /// White bar height, excluding the bottom safe area.
  static const double _barHeight = 66;

  /// Overall height. The button sits flush with the top of this box when idle,
  /// so it straddles the bar's top edge instead of sinking into it.
  static const double _totalHeight = 100;

  /// Clearance between the button's edge and the notch cut around it.
  static const double _notchMargin = 6;

  /// How far the button rises during the promo phase of the loop.
  static const double _liftDistance = 22;

  static const Color _idleBlue = Color(0xFF0066FF);
  static const Color _liftedGreen = Color(0xFF28A745);

  static const Duration _liftDuration = Duration(milliseconds: 600);

  bool _lifted = false;
  Timer? _timer;
  int _tick = 0;

  static const List<({String id, String label, IconData icon})> _items = [
    (id: AppBottomNav.home, label: 'Home', icon: Icons.home_outlined),
    (id: AppBottomNav.property, label: 'Properties', icon: Icons.apartment_outlined),
    (id: AppBottomNav.buyer, label: 'Assistant', icon: Icons.account_circle_outlined),
    (id: AppBottomNav.more, label: 'More', icon: Icons.more_horiz),
  ];

  @override
  void initState() {
    super.initState();
    // 11s cycle in 1s steps; lifted between t=4s and t=8s.
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _tick = (_tick + 1) % 11;
      final shouldLift = _tick >= 4 && _tick < 8;
      if (shouldLift != _lifted && mounted) {
        setState(() => _lifted = shouldLift);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final barHeight = _barHeight + bottomInset;
    final totalHeight = _totalHeight + bottomInset;
    final barTop = totalHeight - barHeight;

    // One tween drives the button's position, its colour and the notch, so the
    // cut in the bar can never lag behind the button it is cut for.
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: _lifted ? _liftDistance : 0),
      duration: _liftDuration,
      curve: Curves.easeInOut,
      builder: (context, lift, _) {
        final progress = lift / _liftDistance;
        final buttonBottom = _totalHeight - _buttonSize + bottomInset + lift;
        final buttonCenterY = totalHeight - buttonBottom - _buttonSize / 2;

        return SizedBox(
          height: totalHeight,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: barHeight,
                child: CustomPaint(
                  painter: _NotchedBarPainter(
                    notchCenterY: buttonCenterY - barTop,
                    notchRadius: _buttonSize / 2 + _notchMargin,
                  ),
                  child: SafeArea(
                    top: false,
                    child: Row(
                      children: [
                        Expanded(child: _tab(_items[0])),
                        Expanded(child: _tab(_items[1])),
                        const Expanded(child: SizedBox()),
                        Expanded(child: _tab(_items[2])),
                        Expanded(child: _tab(_items[3])),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: buttonBottom,
                child: _addButton(progress),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _tab(({String id, String label, IconData icon}) item) {
    final active = widget.activeId == item.id;
    return InkWell(
      onTap: () => widget.onSelect(item.id),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            item.icon,
            size: 22,
            color: active ? AppColors.tealDark : AppColors.textFaint,
          ),
          const SizedBox(height: 4),
          Text(
            item.label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: active ? FontWeight.bold : FontWeight.normal,
              color: active ? AppColors.tealDark : AppColors.textFaint,
            ),
          ),
        ],
      ),
    );
  }

  /// [progress] runs 0 → 1 as the button rises, so the colour and the swap to
  /// the "Add Property" label ride the same curve as the movement.
  Widget _addButton(double progress) {
    final color = Color.lerp(_idleBlue, _liftedGreen, progress)!;

    return GestureDetector(
      onTap: () => widget.onSelect(AppBottomNav.add),
      child: Container(
        width: _buttonSize,
        height: _buttonSize,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 4),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.55),
              blurRadius: 22,
              spreadRadius: 1,
            ),
            const BoxShadow(
              color: Color(0x33000000),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipOval(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: progress > 0.5 ? _addLabel() : _logo(),
          ),
        ),
      ),
    );
  }

  Widget _addLabel() {
    return const Center(
      key: ValueKey('label'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Add',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              height: 1.1,
            ),
          ),
          Text(
            'Property',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _logo() {
    return Image.asset(
      'assets/images/ppc_logo.jpg',
      key: const ValueKey('logo'),
      fit: BoxFit.cover,
      width: _buttonSize,
      height: _buttonSize,
      errorBuilder: (_, __, ___) =>
          const Icon(Icons.add_home_work, color: Colors.white, size: 30),
    );
  }
}

/// The white bar with a circular bite taken out of its top edge for the
/// floating button. [notchCenterY] is the button's centre in the bar's own
/// coordinates, so the cut follows the button as it lifts and closes up on its
/// own once the button has risen clear of the bar.
class _NotchedBarPainter extends CustomPainter {
  const _NotchedBarPainter({
    required this.notchCenterY,
    required this.notchRadius,
  });

  final double notchCenterY;
  final double notchRadius;

  static const CircularNotchedRectangle _shape = CircularNotchedRectangle();

  @override
  void paint(Canvas canvas, Size size) {
    final host = Offset.zero & size;
    final guest = Rect.fromCircle(
      center: Offset(size.width / 2, notchCenterY),
      radius: notchRadius,
    );

    // getOuterPath falls back to a plain rectangle when the two do not overlap,
    // which is exactly what we want once the button has cleared the bar.
    final path = _shape.getOuterPath(host, guest);

    canvas.drawShadow(path, const Color(0x33000000), 8, false);
    canvas.drawPath(path, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant _NotchedBarPainter oldDelegate) =>
      oldDelegate.notchCenterY != notchCenterY ||
      oldDelegate.notchRadius != notchRadius;
}
