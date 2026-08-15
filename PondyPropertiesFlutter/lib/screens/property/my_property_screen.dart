import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/auth_service.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/property_card.dart';

/// MyProperty.jsx / MyProperties.jsx — the owner's own listings with their
/// plan status, plus delete (soft) and "add plan" actions.
class MyPropertyScreen extends StatefulWidget {
  const MyPropertyScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<MyPropertyScreen> createState() => _MyPropertyScreenState();
}

class _MyPropertyScreenState extends State<MyPropertyScreen> {
  List<Property> _items = const [];
  Map<String, int> _imageCounts = const {};
  bool _loading = true;
  String? _error;
  String _statusFilter = 'all';

  static const List<({String key, String label})> _statuses = [
    (key: 'all', label: 'All'),
    (key: 'active', label: 'Active'),
    (key: 'pending', label: 'Pending'),
    (key: 'incomplete', label: 'Incomplete'),
    (key: 'expired', label: 'Expired'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AuthService.recordView(
        context.read<SessionProvider>().phoneNumber,
        'My Property',
      );
    });
  }

  Future<void> _load() async {
    // Reachable from a `.then()` after navigating away, so re-check first.
    if (!mounted) return;
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      setState(() {
        _loading = false;
        _error = 'Please log in to see your properties.';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await PropertyService.fetchMyProperties(session.phoneNumber!);
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
      final counts = await PropertyService.fetchImageCounts(items);
      if (mounted) setState(() => _imageCounts = counts);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  List<Property> get _filtered => _statusFilter == 'all'
      ? _items
      : _items.where((p) => p.status.toLowerCase() == _statusFilter).toList();

  Future<void> _delete(Property p) async {
    final ok = await confirmDialog(
      context,
      title: 'Remove property',
      message:
          'Remove PPC-ID ${p.ppcId} from your listings? You can restore it from '
          'Removed Property.',
      yes: 'Remove',
      no: 'Cancel',
    );
    if (!ok || !mounted) return;
    final session = context.read<SessionProvider>();
    try {
      await PropertyService.deleteProperty(
        phoneNumber: session.phoneNumber!,
        ppcId: p.ppcId,
      );
      if (!mounted) return;
      setState(() => _items = _items.where((x) => x.ppcId != p.ppcId).toList());
      showToast(context, 'Property removed.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Property'),
        actions: [
          IconButton(
            tooltip: 'Removed properties',
            onPressed: () =>
                Navigator.pushNamed(context, AppRoutes.removedProperty),
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        onPressed: () => Navigator.pushNamed(context, AppRoutes.addProperty)
            .then((_) => _load()),
        icon: const Icon(Icons.add_home_work),
        label: const Text('Add Property'),
      ),
      body: body,
    );
  }

  Widget _body() {
    if (_loading) return const AppLoader(label: 'Loading your properties…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);

    return Column(
      children: [
        _statusChips(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: _filtered.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 50),
                      EmptyState(
                        message: _items.isEmpty
                            ? "You haven't listed any property yet."
                            : 'No $_statusFilter properties.',
                        action: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.teal,
                          ),
                          onPressed: () =>
                              Navigator.pushNamed(context, AppRoutes.addProperty)
                                  .then((_) => _load()),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add your first property'),
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(top: 8, bottom: 90),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) => _card(_filtered[i]),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _statusChips() {
    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: _statuses.map((s) {
          final count = s.key == 'all'
              ? _items.length
              : _items.where((p) => p.status.toLowerCase() == s.key).length;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(
                '${s.label} ($count)',
                style: const TextStyle(fontSize: 12),
              ),
              selected: _statusFilter == s.key,
              onSelected: (_) => setState(() => _statusFilter = s.key),
              selectedColor: AppColors.searchBottom,
              side: const BorderSide(color: Color(0xFFDDDDDD)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _card(Property p) {
    return PropertyCard(
      property: p,
      imageCount: _imageCounts[p.ppcId],
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.propertyDetail,
        arguments: p.ppcId,
      ),
      trailing: Container(
        padding: const EdgeInsets.fromLTRB(10, 0, 6, 6),
        child: Row(
          children: [
            _statusBadge(p),
            const Spacer(),
            TextButton.icon(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.pricingPlans,
                arguments: p.ppcId,
              ),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.teal,
                visualDensity: VisualDensity.compact,
              ),
              icon: const Icon(Icons.rocket_launch_outlined, size: 15),
              label: const Text('Plans', style: TextStyle(fontSize: 12)),
            ),
            TextButton.icon(
              onPressed: () => _delete(p),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.onDemand,
                visualDensity: VisualDensity.compact,
              ),
              icon: const Icon(Icons.delete_outline, size: 15),
              label: const Text('Remove', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(Property p) {
    final status = p.status.toLowerCase();
    final (color, label) = switch (status) {
      'active' => (const Color(0xFF2E7D32), 'Active'),
      'pending' => (const Color(0xFFEF6C00), 'Pending'),
      'expired' => (AppColors.onDemand, 'Expired'),
      'incomplete' => (AppColors.textFaint, 'Incomplete'),
      _ => (AppColors.textMuted, Fmt.cap(p.status)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            p.planName == null ? label : '$label · ${p.planName}',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
