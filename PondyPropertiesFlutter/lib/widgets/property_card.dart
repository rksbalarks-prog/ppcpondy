import 'package:flutter/material.dart';

import '../core/formatters.dart';
import '../core/theme.dart';
import '../models/property.dart';
import 'common.dart';

/// The listing card from AllProperty.jsx / PropertyCards.jsx.
///
/// Layout (left 4 cols / right 8 cols, 160px image):
///   ┌───────────┬──────────────────────────────┐
///   │  photo    │ Sale                     📍  │
///   │  ★Featured│ **Individual House**         │
///   │           │ Nagar, Area, City            │
///   │ 📷 4  👁 12│ ⬛ 1200 Sqft   🛏 2 BHK       │
///   │           │ 👤 Owner      📅 12 Jan 2025 │
///   │           │ ₹ 45.00 Lakhs  Negotiable    │
///   └───────────┴──────────────────────────────┘
class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.property,
    this.imageCount,
    this.onTap,
    this.visited = false,
    this.trailing,
  });

  final Property property;
  final int? imageCount;
  final VoidCallback? onTap;

  /// Cards the user already opened turn their title orange, like the web app.
  final bool visited;

  /// Optional action row rendered under the card body (My Property etc.).
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final p = property;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: Material(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        elevation: 0,
        child: InkWell(
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              color: visited ? Colors.white : AppColors.cardBg,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1A000000),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 132, child: _thumbnail(p)),
                      Expanded(child: _body(p)),
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _thumbnail(Property p) {
    return Stack(
      children: [
        AppNetworkImage(
          url: p.coverPhotoUrl,
          width: double.infinity,
          height: 160,
          borderRadius: BorderRadius.circular(15),
        ),
        if (p.isFeatured)
          Positioned(
            top: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(6, 2, 8, 2),
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: AppColors.featuredGradient),
                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(15)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star_border_rounded, size: 13, color: Colors.black),
                  SizedBox(width: 2),
                  Text(
                    'Featured',
                    style: TextStyle(fontSize: 11, color: Colors.black),
                  ),
                ],
              ),
            ),
          ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _badge('assets/images/rectangle_146.png', Icons.photo_camera,
                  '${imageCount ?? p.photoUrls.length}'),
              _badge('assets/images/rectangle_145.png', Icons.visibility,
                  '${p.views}'),
            ],
          ),
        ),
      ],
    );
  }

  /// The two little ribbons sit on top of slanted PNG backgrounds in the web
  /// app; we reuse the same images and fall back to a flat pill.
  Widget _badge(String asset, IconData icon, String text) {
    return Container(
      width: 46,
      height: 20,
      decoration: BoxDecoration(
        image: DecorationImage(image: AssetImage(asset), fit: BoxFit.cover),
        color: Colors.black45,
      ),
      alignment: Alignment.center,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 3),
          Text(text, style: const TextStyle(fontSize: 11, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _body(Property p) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 7, 8, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  Fmt.cap(p.propertyMode),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              if (p.coordinates != null)
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: Image.asset(
                    'assets/images/maplocation.png',
                    width: 15,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.place,
                      size: 15,
                      color: AppColors.tealDark,
                    ),
                  ),
                ),
            ],
          ),
          Text(
            Fmt.cap(p.propertyType),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: visited ? AppColors.visited : AppColors.text,
            ),
          ),
          Text(
            p.locationLine,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _fact('assets/images/total_area-01.png', Icons.square_foot,
                    '${p.totalArea?.toString() ?? 'N/A'} ${Fmt.cap(p.areaUnit)}'),
              ),
              Expanded(
                child: _fact('assets/images/bhk-01.png', Icons.bed,
                    '${p.bedrooms ?? 'N/A'} BHK'),
              ),
            ],
          ),
          Row(
            children: [
              Expanded(
                child: _fact('assets/images/posted_by-01.png', Icons.person,
                    Fmt.cap(p.ownership)),
              ),
              Expanded(
                child: _fact('assets/images/calender-01.png',
                    Icons.calendar_today, Fmt.date(p.displayDate)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Image.asset(
                'assets/images/indian_rupee-01.png',
                width: 9,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  p.priceLabel,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                    color: p.isOnDemand ? AppColors.onDemand : AppColors.tealDark,
                  ),
                ),
              ),
              const SizedBox(width: 5),
              Text(
                p.negotiation == 'Yes' ? 'Negotiable' : 'Non-Negotiable',
                style: const TextStyle(fontSize: 11, color: AppColors.tealDark),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _fact(String asset, IconData fallbackIcon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Image.asset(
            asset,
            width: 12,
            height: 12,
            errorBuilder: (_, __, ___) =>
                Icon(fallbackIcon, size: 12, color: AppColors.textMuted),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Full-bleed promo banner rendered between cards (the `type: 'upload'` rows
/// the web feed splices into the list).
class AdBannerCard extends StatelessWidget {
  const AdBannerCard({super.key, required this.imageUrl, this.onTap});

  final String imageUrl;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: GestureDetector(
        onTap: onTap,
        child: AppNetworkImage(
          url: imageUrl,
          height: 180,
          width: double.infinity,
          fit: BoxFit.fill,
          borderRadius: BorderRadius.circular(15),
        ),
      ),
    );
  }
}
