import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/session.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../routes.dart';
import '../../services/account_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// Notification.jsx — the notification centre, with read/unread filtering,
/// tap-through routing and swipe-to-delete.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NotificationItem> _items = const [];
  Set<String> _locallyRead = {};
  bool _loading = true;
  bool _unreadOnly = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _locallyRead = Session.getStringList(Session.kReadNotifications).toSet();
    _load();
  }

  Future<void> _load() async {
    final session = context.read<SessionProvider>();
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
      final items = await AccountService.fetchNotifications(session.phoneNumber!);
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
      session.refreshUnread();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  bool _isRead(NotificationItem n) => n.isRead || _locallyRead.contains(n.id);

  List<NotificationItem> get _filtered =>
      _unreadOnly ? _items.where((n) => !_isRead(n)).toList() : _items;

  Future<void> _open(NotificationItem n) async {
    if (!_isRead(n) && n.id.isNotEmpty) {
      setState(() => _locallyRead = {..._locallyRead, n.id});
      Session.setStringList(Session.kReadNotifications, _locallyRead.toList());
      try {
        await AccountService.markRead(n.id);
      } catch (_) {
        /* the local flag is enough for the UI */
      }
      if (mounted) context.read<SessionProvider>().refreshUnread();
    }
    if (!mounted) return;

    // Same routing rules as handleSingleNotificationClick on the web.
    final lower = n.message.toLowerCase();
    if (lower.contains('matches your property')) {
      Navigator.pushNamed(context, AppRoutes.activityList,
          arguments: 'matchedBuyers');
    } else if (lower.contains('buyer') && lower.contains('assistance')) {
      Navigator.pushNamed(context, AppRoutes.myBuyerAssistance);
    } else if (n.ppcId != null) {
      Navigator.pushNamed(context, AppRoutes.propertyDetail, arguments: n.ppcId);
    }
  }

  Future<void> _delete(NotificationItem n) async {
    final removed = n;
    setState(() => _items = _items.where((x) => x.id != n.id).toList());
    try {
      await AccountService.deleteByTime(n.createdAtRaw);
      if (mounted) showToast(context, 'Notification deleted');
    } catch (e) {
      if (!mounted) return;
      setState(() => _items = [removed, ..._items]);
      showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((n) => !_isRead(n)).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: Text('Notifications${unread > 0 ? ' ($unread)' : ''}'),
        actions: [
          IconButton(
            tooltip: _unreadOnly ? 'Show all' : 'Show unread only',
            onPressed: () => setState(() => _unreadOnly = !_unreadOnly),
            icon: Icon(
              _unreadOnly ? Icons.filter_alt : Icons.filter_alt_outlined,
            ),
          ),
        ],
      ),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _filtered.isEmpty
                  ? EmptyState(
                      message: _unreadOnly
                          ? 'No unread notifications.'
                          : 'No notifications yet.',
                      icon: Icons.notifications_none,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) => _tile(_filtered[i]),
                      ),
                    ),
    );
  }

  Widget _tile(NotificationItem n) {
    final read = _isRead(n);
    return Dismissible(
      key: ValueKey(n.id.isEmpty ? n.dedupeKey : n.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.onDemand,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => _delete(n),
      child: AppCard(
        onTap: () => _open(n),
        color: read ? Colors.white : const Color(0xFFF1F9F9),
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: read ? const Color(0xFFEFEFEF) : AppColors.searchBottom,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.notifications,
                size: 18,
                color: read ? AppColors.textFaint : AppColors.teal,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (n.title != null)
                    Text(
                      n.title!,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  Text(
                    n.message,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      fontWeight: read ? FontWeight.normal : FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      if (n.ppcId != null) ...[
                        Text(
                          'PPC-ID: ${n.ppcId}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.tealDark,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Text(
                        Fmt.relative(n.createdAt),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textFaint,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (!read)
              const Padding(
                padding: EdgeInsets.only(left: 6, top: 4),
                child: CircleAvatar(radius: 4, backgroundColor: AppColors.orangeRed),
              ),
          ],
        ),
      ),
    );
  }
}
