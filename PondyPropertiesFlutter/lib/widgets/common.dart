import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';

/// Locks page content to the 470px column the web app uses.
class PhoneFrame extends StatelessWidget {
  const PhoneFrame({super.key, required this.child, this.background});

  final Widget child;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: background ?? AppColors.pageBg,
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: kMaxContentWidth),
        child: Material(color: AppColors.surface, child: child),
      ),
    );
  }
}

/// Teal spinner used everywhere the React app showed its loader.
class AppLoader extends StatelessWidget {
  const AppLoader({super.key, this.label});

  final String? label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 34,
            height: 34,
            child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.teal),
          ),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(
              label!,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}

/// The "OOOPS – No Data Found" state from the web app.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    this.message = 'No data found',
    this.action,
    this.icon,
  });

  final String message;
  final Widget? action;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null)
              Icon(icon, size: 54, color: AppColors.tealSoft)
            else
              Image.asset(
                'assets/images/ooops-no-data-found.png',
                height: 150,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.inbox_outlined, size: 54, color: AppColors.tealSoft),
              ),
            const SizedBox(height: 14),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 18), action!],
          ],
        ),
      ),
    );
  }
}

/// Error panel with a retry button.
class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.onDemand),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.textMuted),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.tealSoft,
                  side: const BorderSide(color: AppColors.tealSoft),
                ),
                label: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Network image with the app's placeholder + fallback behaviour.
class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final fallback = Image.asset(
      'assets/images/default.png',
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (_, __, ___) => Container(
        width: width,
        height: height,
        color: AppColors.chipBg,
        child: const Icon(Icons.home_outlined, color: AppColors.textFaint),
      ),
    );

    Widget child;
    if (url == null || url!.isEmpty) {
      child = fallback;
    } else {
      child = CachedNetworkImage(
        imageUrl: url!,
        width: width,
        height: height,
        fit: fit,
        placeholder: (_, __) => Container(
          width: width,
          height: height,
          color: AppColors.chipBg,
        ),
        errorWidget: (_, __, ___) => fallback,
      );
    }

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: child);
    }
    return child;
  }
}

/// Section heading used on detail / menu screens.
class SectionHeading extends StatelessWidget {
  const SectionHeading(this.title, {super.key, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 18, 14, 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.teal,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// White rounded card matching the `.card.shadow.rounded-4` used everywhere.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.fromLTRB(12, 0, 12, 12),
    this.onTap,
    this.color,
  });

  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets margin;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: Material(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(14),
        elevation: 0,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Ink(
            decoration: BoxDecoration(
              color: color ?? Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Padding(padding: padding, child: child),
          ),
        ),
      ),
    );
  }
}

/// Row of a label + value, used by the property detail spec sheet.
class SpecRow extends StatelessWidget {
  const SpecRow({super.key, required this.label, required this.value, this.icon});

  final String label;
  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: AppColors.teal),
            const SizedBox(width: 10),
          ],
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.textFaint),
            ),
          ),
          Expanded(
            flex: 5,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.text,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A single cell of the detail page's two-column spec grid, matching
/// DetailProperty.jsx: a large teal glyph, the label above the value, and the
/// value clipped to one line. Fixed 55px so the two columns stay aligned even
/// when one side wraps.
class SpecTile extends StatelessWidget {
  const SpecTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.fullWidth = false,
  });

  final String label;
  final String value;
  final IconData? icon;

  /// Description spans both columns and is allowed to grow, with no label —
  /// the web's `isDescription` branch.
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: fullWidth ? null : 55,
      child: Row(
        crossAxisAlignment:
            fullWidth ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 26, color: AppColors.teal),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!fullWidth)
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textFaint,
                    ),
                  ),
                Text(
                  value,
                  maxLines: fullWidth ? null : 1,
                  overflow: fullWidth ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                    height: fullWidth ? 1.5 : null,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Yes/No confirmation matching the app's blue-button popup.
Future<bool> confirmDialog(
  BuildContext context, {
  required String message,
  String yes = 'Yes',
  String no = 'No',
  String? title,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      title: title == null
          ? null
          : Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      content: Text(message, style: const TextStyle(fontSize: 14)),
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          style: TextButton.styleFrom(
            foregroundColor: Colors.blue,
            side: const BorderSide(color: Color(0x330D6EFD)),
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
          ),
          child: Text(no),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: FilledButton.styleFrom(
            backgroundColor: Colors.blue,
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
          ),
          child: Text(yes),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// The floating toast the React screens show via `setMessage(...)`.
void showToast(BuildContext context, String message, {bool error = false}) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        backgroundColor: error ? AppColors.onDemand : AppColors.teal,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
}

/// tel: / mailto: / https: launcher shared by the contact buttons.
Future<void> launchExternal(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok && context.mounted) {
    showToast(context, 'Could not open $url', error: true);
  }
}

Future<void> dialPhone(BuildContext context, String? phone) async {
  final digits = (phone ?? '').replaceAll(RegExp(r'[^\d+]'), '');
  if (digits.isEmpty) {
    showToast(context, 'No phone number available', error: true);
    return;
  }
  await launchExternal(context, 'tel:$digits');
}

Future<void> openWhatsApp(BuildContext context, String? phone, String text) async {
  final digits = (phone ?? '').replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return;
  final normalised = digits.length == 10 ? '91$digits' : digits;
  await launchExternal(
    context,
    'https://wa.me/$normalised?text=${Uri.encodeComponent(text)}',
  );
}

Future<void> openMap(BuildContext context, double lat, double lng) =>
    launchExternal(context, 'https://www.google.com/maps/search/?api=1&query=$lat,$lng');
