import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/activity_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// One screen for all the Owner/Buyer-menu lists (Interested Buyers, My
/// Offers, Photo Requests, …). The React app has ~25 near-identical screens
/// under `Components/Detail/`; this drives them all from [ActivityFeed].
class ActivityListScreen extends StatefulWidget {
  const ActivityListScreen({super.key, required this.feedKey});

  final String feedKey;

  @override
  State<ActivityListScreen> createState() => _ActivityListScreenState();
}

class _ActivityListScreenState extends State<ActivityListScreen> {
  ActivityFeed? _feed;
  List<ActivityEntry> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _feed = ActivityService.feedByKey(widget.feedKey);
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final feed = _feed;
    final session = context.read<SessionProvider>();
    if (feed == null) {
      setState(() {
        _loading = false;
        _error = 'Unknown list.';
      });
      return;
    }
    if (!session.isLoggedIn) {
      setState(() {
        _loading = false;
        _error = 'Please log in first.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ActivityService.load(feed, session.phoneNumber!);
      if (mounted) {
        setState(() {
          _items = items;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = describeError(e);
          _loading = false;
        });
      }
    }
  }

  Future<void> _delete(ActivityEntry entry) async {
    final feed = _feed!;
    final session = context.read<SessionProvider>();
    final ok = await confirmDialog(
      context,
      message: 'Remove this entry from your list?',
      yes: 'Remove',
      no: 'Cancel',
    );
    if (!ok) return;

    final removed = entry;
    setState(() => _items = _items.where((e) => e != entry).toList());
    try {
      await ActivityService.softDelete(
        feed,
        session.phoneNumber!,
        entry.id.isNotEmpty ? entry.id : (entry.ppcId ?? ''),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: const Text('Removed', style: TextStyle(fontSize: 13)),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(12),
            action: feed.undoPath == null
                ? null
                : SnackBarAction(
                    label: 'UNDO',
                    textColor: Colors.white,
                    onPressed: () => _undo(removed),
                  ),
          ),
        );
    } catch (e) {
      if (!mounted) return;
      setState(() => _items = [removed, ..._items]);
      showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _undo(ActivityEntry entry) async {
    final session = context.read<SessionProvider>();
    try {
      await ActivityService.undoDelete(
        _feed!,
        session.phoneNumber!,
        entry.id.isNotEmpty ? entry.id : (entry.ppcId ?? ''),
      );
      await _load();
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _respondToOffer(ActivityEntry entry, bool accept) async {
    try {
      await ActivityService.respondToOffer(offerId: entry.id, accept: accept);
      if (!mounted) return;
      showToast(context, accept ? 'Offer accepted.' : 'Offer rejected.');
      await _load();
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _sendPhotos(ActivityEntry entry) async {
    final session = context.read<SessionProvider>();
    final ppcId = entry.ppcId;
    if (ppcId == null) return;
    try {
      await ActivityService.sendPhotos(
        phoneNumber: session.phoneNumber!,
        ppcId: ppcId,
      );
      if (mounted) showToast(context, 'Photos sent to the buyer.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _sendAddress(ActivityEntry entry) async {
    try {
      await ActivityService.sendAddress(entry.id);
      if (mounted) showToast(context, 'Address shared.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(title: Text(_feed?.title ?? 'List')),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? EmptyState(
                      message: _feed?.emptyText ?? 'Nothing here yet.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        itemCount: _items.length,
                        itemBuilder: (_, i) => _tile(_items[i]),
                      ),
                    ),
    );
  }

  Widget _tile(ActivityEntry entry) {
    final propertyJson = entry.property;
    final property = propertyJson == null ? null : Property(propertyJson);
    final ppcId = entry.ppcId;

    return AppCard(
      padding: const EdgeInsets.fromLTRB(12, 12, 8, 8),
      onTap: ppcId == null
          ? null
          : () => Navigator.pushNamed(
                context,
                AppRoutes.propertyDetail,
                arguments: ppcId,
              ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (property?.coverPhotoUrl != null)
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: AppNetworkImage(
                    url: property!.coverPhotoUrl,
                    width: 68,
                    height: 58,
                    borderRadius: BorderRadius.circular(10),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.searchBottom,
                    child: Text(
                      (entry.name ?? entry.phone ?? '?')
                          .characters
                          .first
                          .toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.tealDark,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _titleFor(entry, property),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    if (property != null)
                      Text(
                        '${property.locationLine} · ${property.priceLabel}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    if (ppcId != null)
                      Text(
                        'PPC-ID: $ppcId',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textFaint,
                        ),
                      ),
                    if (entry.offerAmount != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(
                          'Offer: ${Fmt.price(entry.offerAmount)}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.tealDark,
                          ),
                        ),
                      ),
                    if (entry.note != null && entry.offerAmount == null)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(
                          entry.note!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (entry.date != null)
                Text(
                  Fmt.relative(entry.date),
                  style: const TextStyle(fontSize: 10.5, color: AppColors.textFaint),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              if (entry.phone != null)
                TextButton.icon(
                  onPressed: () => dialPhone(context, entry.phone),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.teal,
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.call, size: 15),
                  label: Text(
                    entry.phone!,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              const Spacer(),
              ..._actionsFor(entry),
              if (_feed?.deletePath != null)
                IconButton(
                  tooltip: 'Remove',
                  onPressed: () => _delete(entry),
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.delete_outline,
                      size: 18, color: AppColors.onDemand),
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _titleFor(ActivityEntry entry, Property? property) {
    if (entry.name != null) return entry.name!;
    if (property != null) return Fmt.cap(property.propertyType);
    if (entry.phone != null) return entry.phone!;
    return 'Entry';
  }

  List<Widget> _actionsFor(ActivityEntry entry) {
    switch (widget.feedKey) {
      case 'offersFromBuyers':
        return [
          TextButton(
            onPressed: () => _respondToOffer(entry, true),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF2E7D32),
              visualDensity: VisualDensity.compact,
            ),
            child: const Text('Accept', style: TextStyle(fontSize: 12)),
          ),
          TextButton(
            onPressed: () => _respondToOffer(entry, false),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.onDemand,
              visualDensity: VisualDensity.compact,
            ),
            child: const Text('Reject', style: TextStyle(fontSize: 12)),
          ),
        ];
      case 'photoRequestedBuyers':
        return [
          TextButton.icon(
            onPressed: () => _sendPhotos(entry),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.teal,
              visualDensity: VisualDensity.compact,
            ),
            icon: const Icon(Icons.send, size: 14),
            label: const Text('Send photos', style: TextStyle(fontSize: 12)),
          ),
        ];
      case 'addressRequestsOwner':
        return [
          TextButton.icon(
            onPressed: () => _sendAddress(entry),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.teal,
              visualDensity: VisualDensity.compact,
            ),
            icon: const Icon(Icons.place, size: 14),
            label: const Text('Share address', style: TextStyle(fontSize: 12)),
          ),
        ];
      default:
        return const [];
    }
  }
}
