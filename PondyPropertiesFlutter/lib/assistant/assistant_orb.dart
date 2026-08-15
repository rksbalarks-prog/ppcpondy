import 'dart:math' as math;

import 'package:flutter/material.dart';

/// The assistant's voice call-to-action orb.
///
/// A port of the web widget's `.ppc-aibtn` (assistant.css): an 88px button with a
/// rotating conic shimmer ring, a solid green core that floats up and down, and
/// a 👆 finger nudging the user to tap it. Values below mirror that CSS, so keep
/// the two in step.
class AssistantOrb extends StatefulWidget {
  const AssistantOrb({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  State<AssistantOrb> createState() => _AssistantOrbState();
}

class _AssistantOrbState extends State<AssistantOrb>
    with TickerProviderStateMixin {
  static const _teal = Color(0xFF30747F);

  // ppc-aispin 3.4s linear infinite
  late final AnimationController _spin = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3400),
  );

  // ppc-aifloat 3s ease-in-out infinite (0 -> -7px -> 0)
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );

  // ppc-tap 1.15s ease-in-out infinite
  late final AnimationController _tap = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1150),
  );

  bool _animating = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Honour the OS "reduce motion" setting, as the CSS does with
    // prefers-reduced-motion.
    final wanted = !MediaQuery.of(context).disableAnimations;
    if (wanted == _animating) return;
    _animating = wanted;
    if (wanted) {
      _spin.repeat();
      _float.repeat(reverse: true);
      _tap.repeat();
    } else {
      _spin.stop();
      _float.stop();
      _tap.stop();
    }
  }

  @override
  void dispose() {
    _spin.dispose();
    _float.dispose();
    _tap.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _float,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_float.value);
        return Transform.translate(offset: Offset(0, -7 * t), child: child);
      },
      child: SizedBox(
        width: 88,
        height: 88,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            _ring(),
            _core(),
            Positioned(right: -14, bottom: -10, child: _finger()),
          ],
        ),
      ),
    );
  }

  /// conic-gradient(from 0deg, transparent, #7ED4DC .95, transparent 55%)
  Widget _ring() {
    return RotationTransition(
      turns: _spin,
      child: Container(
        width: 82,
        height: 82,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: SweepGradient(
            colors: [
              Color(0x0030747F),
              Color(0xF27ED4DC),
              Color(0x0030747F),
              Color(0x0030747F),
            ],
            stops: [0.0, 0.275, 0.55, 1.0],
          ),
        ),
      ),
    );
  }

  Widget _core() {
    return Material(
      color: _teal,
      shape: const CircleBorder(),
      elevation: 0,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: widget.onTap,
        child: Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _teal,
            boxShadow: [
              BoxShadow(
                color: _teal.withValues(alpha: 0.45),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 38),
        ),
      ),
    );
  }

  /// Rests, then jabs up-left and holds briefly before snapping back — the
  /// 0% / 45% / 60% / 100% keyframe shape of ppc-tap.
  Widget _finger() {
    return AnimatedBuilder(
      animation: _tap,
      builder: (context, _) {
        final v = _tap.value;
        final double p;
        if (v < 0.45) {
          p = Curves.easeInOut.transform(v / 0.45);
        } else if (v < 0.60) {
          p = 1;
        } else {
          p = 1 - Curves.easeInOut.transform((v - 0.60) / 0.40);
        }
        return Transform.translate(
          offset: Offset(-10 * p, -14 * p),
          child: Transform.rotate(
            angle: -12 * math.pi / 180,
            child: const Text('👆', style: TextStyle(fontSize: 32)),
          ),
        );
      },
    );
  }
}
