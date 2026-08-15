import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/property_card.dart';

/// RemovedProperty.jsx — soft-deleted listings with an undo action.
class RemovedPropertyScreen extends StatefulWidget {
  const RemovedPropertyScreen({super.key});

  @override
  State<RemovedPropertyScreen> createState() => _RemovedPropertyScreenState();
}

class _RemovedPropertyScreenState extends State<RemovedPropertyScreen> {
  List<Property> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
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
      final items =
          await PropertyService.fetchRemovedProperties(session.phoneNumber!);
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

  Future<void> _restore(Property p) async {
    final session = context.read<SessionProvider>();
    try {
      await PropertyService.undoDelete(
        phoneNumber: session.phoneNumber!,
        ppcId: p.ppcId,
      );
      if (!mounted) return;
      setState(() => _items = _items.where((x) => x.ppcId != p.ppcId).toList());
      showToast(context, 'Property restored.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Removed Property')),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyState(message: 'No removed properties.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        itemCount: _items.length,
                        itemBuilder: (_, i) {
                          final p = _items[i];
                          return PropertyCard(
                            property: p,
                            onTap: () => Navigator.pushNamed(
                              context,
                              AppRoutes.propertyDetail,
                              arguments: p.ppcId,
                            ),
                            trailing: Padding(
                              padding: const EdgeInsets.fromLTRB(10, 0, 8, 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _restore(p),
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppColors.teal,
                                    ),
                                    icon: const Icon(Icons.restore, size: 16),
                                    label: const Text(
                                      'Restore',
                                      style: TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
