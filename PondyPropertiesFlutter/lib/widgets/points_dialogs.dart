import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../routes.dart';

/// Ports InsufficientPointsModal.jsx and the "View this contact again?" confirm
/// modal at the bottom of Details.jsx.
///
/// Both are the same glass card — a 150px gradient hero with a floating coin
/// above a body of badge / gradient title / stat row / CTA — differing only in
/// accent colour and copy, so they share [_PointsDialogShell].

// ── Palette lifted from the two modals' inline styles ──────────────────────
const Color _scrim = Color(0xA6080414); // rgba(8,4,20,0.65)
const Color _auraPurple = Color(0xFF9D5CFF);
const Color _auraGold = Color(0xFFFFC857);
const Color _auraCyan = Color(0xFF22D3EE);
const Color _coinDeep = Color(0xFFFF7A45);
const Color _coinPale = Color(0xFFFFE9B3);
const Color _heroTop = Color(0xFF1B0E3F);
const Color _heroMid = Color(0xFF3A1B73);
const Color _heroEnd = Color(0xFF150C2E);
const Color _ctaFrom = Color(0xFF1A7C3E);
const Color _ctaTo = Color(0xFF27AE60);
const Color _lilac = Color(0xFFD7BBFF);
const Color _pink = Color(0xFFF9A8D4);

/// The web's `POINTS_PER_CONTACT_VIEW` (Details.jsx). Fallback only — the admin
/// can retune the server-side cost via /points-config.
const int kPointsPerContactView = 10;

/// InsufficientPointsModal.jsx — shown when the balance can't cover a reveal.
///
/// "Buy Points Now" skips the plan picker and jumps straight at the ₹100 /
/// 100-point pack, exactly like the web's `autoBuy` navigation state.
Future<void> showInsufficientPointsDialog(
  BuildContext context, {
  required num balance,
  int required = kPointsPerContactView,
  String contactLabel = 'owner',
}) {
  final needed = (required - balance).clamp(0, required);

  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Not enough points',
    barrierColor: _scrim,
    transitionDuration: const Duration(milliseconds: 300),
    transitionBuilder: _popIn,
    pageBuilder: (context, _, __) => _PointsDialogShell(
      accent: _auraGold,
      heroAccent: const Color(0x4DFFC857), // rgba(255,200,87,0.30)
      coinSize: 92,
      coinColors: const [_auraGold, _coinDeep],
      badge: 'NOT ENOUGH POINTS',
      badgeIcon: Icons.auto_awesome,
      badgeColor: _auraGold,
      title: 'Need $needed more points',
      subtitle: "You need $required points to unlock the $contactLabel's contact.",
      showClose: true,
      body: _StatGrid(
        leftLabel: 'Your balance',
        leftValue: '$balance pts',
        leftColor: _lilac,
        rightLabel: 'You need',
        rightValue: '$required pts',
        rightColor: _pink,
      ),
      actions: [
        _Cta(
          label: 'Buy Points Now',
          icon: Icons.account_balance_wallet,
          onTap: () {
            Navigator.pop(context);
            // PointsPlansScreen reads this and fires the purchase on load.
            Navigator.pushNamed(
              context,
              AppRoutes.pointsPlans,
              arguments: const {'price': 100, 'points': 100},
            );
          },
        ),
        _GhostButton(label: 'Maybe later', onTap: () => Navigator.pop(context)),
      ],
    ),
  );
}

/// The re-view confirm from Details.jsx: this contact was already paid for
/// once, so ask before spending the points again. Resolves true on "Yes".
Future<bool> showRevealAgainDialog(
  BuildContext context, {
  int cost = kPointsPerContactView,
}) async {
  final ok = await showGeneralDialog<bool>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'View this contact again?',
    barrierColor: _scrim,
    transitionDuration: const Duration(milliseconds: 300),
    transitionBuilder: _popIn,
    pageBuilder: (context, _, __) => _PointsDialogShell(
      accent: _auraCyan,
      heroAccent: const Color(0x4D22D3EE), // rgba(34,211,238,0.30)
      coinSize: 84,
      coinColors: const [_coinPale, _auraGold, _coinDeep],
      badge: '👁 ALREADY VIEWED',
      badgeColor: _auraPurple,
      title: 'View this contact again?',
      subtitle: "You've already viewed this property's owner contact.",
      body: _CostRow(cost: cost),
      actions: [
        Row(
          children: [
            Expanded(
              flex: 10,
              child: _GhostButton(
                label: 'No, cancel',
                outlined: true,
                onTap: () => Navigator.pop(context, false),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 14,
              child: _Cta(
                label: 'Yes, deduct $cost pts',
                onTap: () => Navigator.pop(context, true),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// `ipmPop` / `rcPop` — 0.3s cubic-bezier(0.34,1.56,0.64,1): a slight overshoot
/// as the card scales up from 0.92 and rises 14px.
Widget _popIn(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondary,
  Widget child,
) {
  final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutBack);
  return FadeTransition(
    opacity: animation,
    child: AnimatedBuilder(
      animation: curved,
      builder: (context, inner) => Transform.translate(
        offset: Offset(0, 14 * (1 - curved.value)),
        child: Transform.scale(
          scale: 0.92 + 0.08 * curved.value,
          child: inner,
        ),
      ),
      child: child,
    ),
  );
}

// ───────────────────────────── shell ─────────────────────────────

class _PointsDialogShell extends StatelessWidget {
  const _PointsDialogShell({
    required this.accent,
    required this.heroAccent,
    required this.coinSize,
    required this.coinColors,
    required this.badge,
    required this.badgeColor,
    required this.title,
    required this.subtitle,
    required this.body,
    required this.actions,
    this.badgeIcon,
    this.showClose = false,
  });

  final Color accent;
  final Color heroAccent;
  final double coinSize;
  final List<Color> coinColors;
  final String badge;
  final IconData? badgeIcon;
  final Color badgeColor;
  final String title;
  final String subtitle;
  final Widget body;
  final List<Widget> actions;
  final bool showClose;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: _Aura(
            accent: accent,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                // backdrop-filter: blur(22px)
                filter: ui.ImageFilter.blur(sigmaX: 22, sigmaY: 22),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: 0.10),
                        Colors.white.withValues(alpha: 0.04),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.14),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _hero(context),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(22, 20, 22, 24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _badge(),
                            const SizedBox(height: 12),
                            _gradientTitle(),
                            const SizedBox(height: 6),
                            Text(
                              subtitle,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13.5,
                                color: Colors.white.withValues(alpha: 0.70),
                              ),
                            ),
                            const SizedBox(height: 16),
                            body,
                            const SizedBox(height: 18),
                            ...actions,
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// The 150px hero: a deep-violet base with two blurred colour blobs and the
  /// floating coin, matching the modal's stacked radial gradients.
  Widget _hero(BuildContext context) {
    return SizedBox(
      height: 150,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.hardEdge,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_heroTop, _heroMid, _heroEnd],
                stops: [0.0, 0.5, 1.0],
              ),
            ),
            child: SizedBox.expand(),
          ),
          _blob(top: -30, right: -20, size: 140, color: heroAccent, blur: 28),
          _blob(
            bottom: -30,
            left: -20,
            size: 160,
            color: _auraPurple.withValues(alpha: 0.30),
            blur: 36,
          ),
          _FloatingCoin(size: coinSize, colors: coinColors),
          if (showClose)
            Positioned(
              top: 12,
              right: 12,
              child: _CloseButton(onTap: () => Navigator.pop(context)),
            ),
        ],
      ),
    );
  }

  Widget _blob({
    double? top,
    double? left,
    double? right,
    double? bottom,
    required double size,
    required Color color,
    required double blur,
  }) {
    return Positioned(
      top: top,
      left: left,
      right: right,
      bottom: bottom,
      child: ImageFiltered(
        imageFilter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
      ),
    );
  }

  Widget _badge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: badgeColor.withValues(alpha: 0.38)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badgeIcon != null) ...[
            Icon(badgeIcon, size: 13, color: _coinPale),
            const SizedBox(width: 6),
          ],
          Text(
            badge,
            style: const TextStyle(
              color: _coinPale,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.7,
            ),
          ),
        ],
      ),
    );
  }

  /// linear-gradient(135deg,#fff,#C9C2FF 60%,#22D3EE) painted through the text.
  Widget _gradientTitle() {
    return ShaderMask(
      shaderCallback: (rect) => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Colors.white, Color(0xFFC9C2FF), _auraCyan],
        stops: [0.0, 0.6, 1.0],
      ).createShader(rect),
      child: Text(
        title,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 21,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
          color: Colors.white,
        ),
      ),
    );
  }
}

// ───────────────────────────── animated bits ─────────────────────────────

/// `ipmGlowAura` / `rcAura` — 4s ease-in-out, the halo cycling purple → accent.
class _Aura extends StatefulWidget {
  const _Aura({required this.accent, required this.child});

  final Color accent;
  final Widget child;

  @override
  State<_Aura> createState() => _AuraState();
}

class _AuraState extends State<_Aura> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2000), // 4s round trip
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        final t = Curves.easeInOut.transform(_c.value);
        final glow = Color.lerp(_auraPurple, widget.accent, t)!;
        return DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(color: glow.withValues(alpha: 0.45 + 0.10 * t), spreadRadius: 1),
              BoxShadow(color: glow.withValues(alpha: 0.45 + 0.05 * t), blurRadius: 60 + 10 * t),
              const BoxShadow(
                color: Color(0x8C000000),
                blurRadius: 80,
                offset: Offset(0, 30),
              ),
            ],
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// `ipmFloat` — bobs 8px while rocking between −6° and +6°.
class _FloatingCoin extends StatefulWidget {
  const _FloatingCoin({required this.size, required this.colors});

  final double size;
  final List<Color> colors;

  @override
  State<_FloatingCoin> createState() => _FloatingCoinState();
}

class _FloatingCoinState extends State<_FloatingCoin>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300), // 2.6s round trip
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = Curves.easeInOut.transform(_c.value);
        return Transform.translate(
          offset: Offset(0, -8 * t),
          child: Transform.rotate(
            angle: (-6 + 12 * t) * 3.1415926535 / 180,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: widget.colors,
                ),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.45),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _coinDeep.withValues(alpha: 0.55),
                    blurRadius: 40,
                    offset: const Offset(0, 18),
                  ),
                  BoxShadow(
                    color: _auraGold.withValues(alpha: 0.30),
                    blurRadius: 50,
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: Text(
                '🪙',
                style: TextStyle(fontSize: widget.size * 0.46),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// `ipmBtnPulse` / `rcCtaPulse` — the CTA's shadow breathing green → cyan.
class _Cta extends StatefulWidget {
  const _Cta({required this.label, required this.onTap, this.icon});

  final String label;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  State<_Cta> createState() => _CtaState();
}

class _CtaState extends State<_Cta> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300), // 2.6s round trip
  )..repeat(reverse: true);

  bool _pressed = false;

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = Curves.easeInOut.transform(_c.value);
        final glow = Color.lerp(
          const Color(0xFF22C55E).withValues(alpha: 0.45),
          _auraCyan.withValues(alpha: 0.55),
          t,
        )!;
        return GestureDetector(
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: _pressed ? 0.97 : 1,
            duration: const Duration(milliseconds: 120),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_ctaFrom, _ctaTo],
                ),
                borderRadius: BorderRadius.circular(13),
                boxShadow: [
                  BoxShadow(
                    color: glow,
                    blurRadius: 30 + 6 * t,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, size: 15, color: Colors.white),
                    const SizedBox(width: 10),
                  ],
                  Text(
                    widget.label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _GhostButton extends StatelessWidget {
  const _GhostButton({
    required this.label,
    required this.onTap,
    this.outlined = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        margin: EdgeInsets.only(top: outlined ? 0 : 12),
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: outlined
            ? BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.18),
                  width: 1.5,
                ),
              )
            : null,
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: outlined ? Colors.white : Colors.white.withValues(alpha: 0.55),
            fontWeight: outlined ? FontWeight.w700 : FontWeight.w600,
            fontSize: outlined ? 14 : 13,
          ),
        ),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
        ),
        child: const Icon(Icons.close, size: 14, color: Colors.white),
      ),
    );
  }
}

// ───────────────────────────── body blocks ─────────────────────────────

/// The two-up "Your balance / You need" panel.
class _StatGrid extends StatelessWidget {
  const _StatGrid({
    required this.leftLabel,
    required this.leftValue,
    required this.leftColor,
    required this.rightLabel,
    required this.rightValue,
    required this.rightColor,
  });

  final String leftLabel, leftValue, rightLabel, rightValue;
  final Color leftColor, rightColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: _panelDecoration,
      child: Row(
        children: [
          Expanded(
            child: _stat(leftLabel, leftValue, leftColor, CrossAxisAlignment.start),
          ),
          Expanded(
            child: _stat(rightLabel, rightValue, rightColor, CrossAxisAlignment.end),
          ),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color, CrossAxisAlignment align) {
    return Column(
      crossAxisAlignment: align,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label.toUpperCase(), style: _statLabelStyle),
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: color,
            shadows: [BoxShadow(color: color.withValues(alpha: 0.55), blurRadius: 14)],
          ),
        ),
      ],
    );
  }
}

/// The confirm modal's "This will cost −N pts" row with its coin tile.
class _CostRow extends StatelessWidget {
  const _CostRow({required this.cost});

  final int cost;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: _panelDecoration,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('THIS WILL COST', style: _statLabelStyle),
              Text(
                '−$cost pts',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: _pink,
                  shadows: [
                    BoxShadow(color: _pink.withValues(alpha: 0.55), blurRadius: 14),
                  ],
                ),
              ),
            ],
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_auraGold, _coinDeep],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: _coinDeep.withValues(alpha: 0.50),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: const Text('🪙', style: TextStyle(fontSize: 22)),
          ),
        ],
      ),
    );
  }
}

final BoxDecoration _panelDecoration = BoxDecoration(
  color: Colors.white.withValues(alpha: 0.045),
  borderRadius: BorderRadius.circular(14),
  border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
);

final TextStyle _statLabelStyle = TextStyle(
  color: Colors.white.withValues(alpha: 0.6),
  fontSize: 11,
  fontWeight: FontWeight.w700,
  letterSpacing: 0.6,
);
