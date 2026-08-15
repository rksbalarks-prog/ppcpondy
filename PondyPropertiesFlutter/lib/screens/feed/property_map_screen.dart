import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/property_service.dart';
import '../../widgets/common.dart';

/// PropertyMap.jsx — every listing that has coordinates, plotted with its
/// PPC-ID label. Uses OpenStreetMap tiles so no Google Maps key is required.
class PropertyMapScreen extends StatefulWidget {
  const PropertyMapScreen({super.key, this.embedded = false});

  /// True when hosted inside the main shell's content area.
  final bool embedded;

  @override
  State<PropertyMapScreen> createState() => _PropertyMapScreenState();
}

class _PropertyMapScreenState extends State<PropertyMapScreen> {
  final _mapController = MapController();

  List<Property> _items = const [];
  bool _loading = true;
  String? _error;
  Property? _selected;

  static final LatLng _pondicherry = LatLng(11.9416, 79.8083);

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final all = await PropertyService.fetchActiveProperties();
      if (!mounted) return;
      setState(() {
        _items = all.where((p) => p.coordinates != null).toList();
        _loading = false;
      });
      _fitBounds();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  void _fitBounds() {
    if (_items.isEmpty) return;
    final points = _items
        .map((p) => LatLng(p.coordinates!.lat, p.coordinates!.lng))
        .toList();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        _mapController.fitCamera(
          CameraFit.coordinates(
            coordinates: points,
            padding: const EdgeInsets.all(48),
            maxZoom: 15,
          ),
        );
      } catch (_) {
        /* map not laid out yet */
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (widget.embedded) return body;
    return Scaffold(
      appBar: AppBar(title: const Text('Property Map')),
      body: body,
    );
  }

  Widget _body() {
    if (_loading) return const AppLoader(label: 'Loading map…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);
    if (_items.isEmpty) {
      return const EmptyState(
        message: 'No properties have map coordinates yet.',
        icon: Icons.map_outlined,
      );
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _pondicherry,
            initialZoom: 12,
            onTap: (_, __) => setState(() => _selected = null),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.ppcpondy.pondy_properties',
            ),
            MarkerLayer(markers: _items.map(_marker).toList()),
          ],
        ),
        Positioned(
          top: 10,
          left: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              boxShadow: const [
                BoxShadow(color: Color(0x22000000), blurRadius: 8),
              ],
            ),
            child: Text(
              '${_items.length} properties on map',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.tealDark,
              ),
            ),
          ),
        ),
        if (_selected != null)
          Positioned(left: 0, right: 0, bottom: 12, child: _preview(_selected!)),
      ],
    );
  }

  Marker _marker(Property p) {
    final c = p.coordinates!;
    return Marker(
      point: LatLng(c.lat, c.lng),
      width: 82,
      height: 54,
      child: GestureDetector(
        onTap: () => setState(() => _selected = p),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(5),
                boxShadow: const [
                  BoxShadow(color: Color(0x33000000), blurRadius: 4),
                ],
              ),
              child: Text(
                p.ppcId,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
            ),
            const Icon(Icons.location_on, color: Color(0xFF007BFF), size: 30),
          ],
        ),
      ),
    );
  }

  Widget _preview(Property p) {
    return AppCard(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(10),
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.propertyDetail,
        arguments: p.ppcId,
      ),
      child: Row(
        children: [
          AppNetworkImage(
            url: p.coverPhotoUrl,
            width: 74,
            height: 60,
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${p.propertyType ?? 'Property'} · PPC-${p.ppcId}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  p.locationLine,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  p.priceLabel,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tealDark,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Open in Maps',
            onPressed: () => openMap(context, p.coordinates!.lat, p.coordinates!.lng),
            icon: const Icon(Icons.directions, color: AppColors.teal),
          ),
        ],
      ),
    );
  }
}
