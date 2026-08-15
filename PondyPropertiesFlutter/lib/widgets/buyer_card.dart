import 'package:flutter/material.dart';

import '../core/formatters.dart';
import '../core/theme.dart';
import '../models/buyer_assistance.dart';
import 'common.dart';

/// The buyer-requirement card used by BuyerLists.jsx and MyBuyerAssistance.
class BuyerCard extends StatelessWidget {
  const BuyerCard({
    super.key,
    required this.buyer,
    this.onTap,
    this.onContact,
    this.onEdit,
    this.onDelete,
    this.contactLocked = false,
  });

  final BuyerAssistance buyer;
  final VoidCallback? onTap;
  final VoidCallback? onContact;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  /// True when the user's plan doesn't include buyer contact details.
  final bool contactLocked;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.searchBottom,
                child: Text(
                  (buyer.name ?? 'B').characters.first.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.tealDark,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      buyer.name ?? 'Buyer',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'BA-ID: ${buyer.baId}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textFaint,
                      ),
                    ),
                  ],
                ),
              ),
              _statusBadge(),
            ],
          ),
          const SizedBox(height: 10),
          _line(Icons.home_work_outlined,
              '${Fmt.cap(buyer.propertyMode)} · ${Fmt.cap(buyer.propertyType)}'),
          _line(Icons.place_outlined, buyer.locationLine),
          _line(Icons.account_balance_wallet_outlined, buyer.budgetLabel),
          if (buyer.bedrooms != null)
            _line(Icons.bed_outlined, '${buyer.bedrooms} BHK'),
          if (buyer.totalArea != null)
            _line(Icons.square_foot,
                '${buyer.totalArea} ${buyer.areaUnit ?? ''}'.trim()),
          if ((buyer.description ?? '').isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                buyer.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                Fmt.date(buyer.createdAt),
                style: const TextStyle(fontSize: 11, color: AppColors.textFaint),
              ),
              const Spacer(),
              if (onEdit != null)
                IconButton(
                  tooltip: 'Edit',
                  onPressed: onEdit,
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.edit_outlined,
                      size: 18, color: AppColors.teal),
                ),
              if (onDelete != null)
                IconButton(
                  tooltip: 'Delete',
                  onPressed: onDelete,
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.delete_outline,
                      size: 18, color: AppColors.onDemand),
                ),
              if (onContact != null)
                FilledButton.icon(
                  onPressed: onContact,
                  style: FilledButton.styleFrom(
                    backgroundColor:
                        contactLocked ? AppColors.textFaint : AppColors.tealDark,
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  icon: Icon(
                    contactLocked ? Icons.lock_outline : Icons.call,
                    size: 15,
                  ),
                  label: Text(
                    contactLocked ? 'Unlock' : 'Contact',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusBadge() {
    final active = buyer.isActive;
    final color = active ? const Color(0xFF2E7D32) : const Color(0xFFEF6C00);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        active ? 'Active' : 'Pending',
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _line(IconData icon, String text) {
    if (text.trim().isEmpty || text == 'N/A') return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AppColors.teal),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }
}
