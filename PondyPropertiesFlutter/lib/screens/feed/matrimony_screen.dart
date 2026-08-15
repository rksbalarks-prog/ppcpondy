import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../models/misc_models.dart';
import '../../services/property_service.dart';
import '../../widgets/common.dart';

/// Groom.jsx / Bride.jsx — the matrimony promo galleries in the top bar.
/// Tapping a tile records the click the same way the web does.
class MatrimonyScreen extends StatefulWidget {
  const MatrimonyScreen({super.key, required this.bride});

  final bool bride;

  @override
  State<MatrimonyScreen> createState() => _MatrimonyScreenState();
}

class _MatrimonyScreenState extends State<MatrimonyScreen> {
  List<AdImage> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = widget.bride
          ? await PropertyService.fetchBrideImages()
          : await PropertyService.fetchGroomImages();
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const AppLoader();
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);
    if (_items.isEmpty) {
      return EmptyState(
        message: widget.bride
            ? 'No bride profiles available right now.'
            : 'No groom profiles available right now.',
        icon: Icons.favorite_border,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.78,
        ),
        itemCount: _items.length,
        itemBuilder: (_, i) {
          final ad = _items[i];
          return GestureDetector(
            onTap: ad.link == null ? null : () => launchExternal(context, ad.link!),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AppNetworkImage(url: ad.imageUrl, fit: BoxFit.cover),
            ),
          );
        },
      ),
    );
  }
}
