import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/property_service.dart';
import '../../services/response_utils.dart';
import '../../widgets/common.dart';

/// PropertyVideo.jsx — listings that have an uploaded walkthrough video.
class PropertyVideoScreen extends StatefulWidget {
  const PropertyVideoScreen({super.key});

  @override
  State<PropertyVideoScreen> createState() => _PropertyVideoScreenState();
}

class _PropertyVideoScreenState extends State<PropertyVideoScreen> {
  List<Property> _items = const [];
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
      List<Property> items;
      try {
        final body = await ApiClient.instance.get('/get-property-videos');
        items = asList(body).map(Property.fromJson).toList();
      } catch (_) {
        items = const [];
      }
      // Fall back to filtering the active feed when the dedicated endpoint is
      // unavailable, so the tab still shows something useful.
      if (items.isEmpty) {
        final all = await PropertyService.fetchActiveProperties();
        items = all.where((p) => p.videoUrls.isNotEmpty).toList();
      }
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
    if (_loading) return const AppLoader(label: 'Loading videos…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);
    if (_items.isEmpty) {
      return const EmptyState(
        message: 'No property videos available yet.',
        icon: Icons.videocam_off_outlined,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 10),
        itemCount: _items.length,
        itemBuilder: (_, i) => _VideoCard(property: _items[i]),
      ),
    );
  }
}

class _VideoCard extends StatefulWidget {
  const _VideoCard({required this.property});

  final Property property;

  @override
  State<_VideoCard> createState() => _VideoCardState();
}

class _VideoCardState extends State<_VideoCard> {
  VideoPlayerController? _controller;
  bool _initialising = false;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _play() async {
    final urls = widget.property.videoUrls;
    if (urls.isEmpty) return;
    setState(() => _initialising = true);
    final controller = VideoPlayerController.networkUrl(Uri.parse(urls.first));
    try {
      await controller.initialize();
      await controller.setLooping(true);
      await controller.play();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
        _initialising = false;
      });
    } catch (_) {
      await controller.dispose();
      if (mounted) {
        setState(() => _initialising = false);
        showToast(context, 'Could not play this video.', error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.property;
    final ready = _controller?.value.isInitialized ?? false;

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: () => Navigator.pushNamed(
        context,
        AppRoutes.propertyDetail,
        arguments: p.ppcId,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            child: AspectRatio(
              aspectRatio: ready ? _controller!.value.aspectRatio : 16 / 9,
              child: ready
                  ? GestureDetector(
                      onTap: () => setState(() {
                        _controller!.value.isPlaying
                            ? _controller!.pause()
                            : _controller!.play();
                      }),
                      child: VideoPlayer(_controller!),
                    )
                  : Stack(
                      fit: StackFit.expand,
                      children: [
                        AppNetworkImage(url: p.coverPhotoUrl),
                        Container(color: Colors.black26),
                        Center(
                          child: _initialising
                              ? const CircularProgressIndicator(color: Colors.white)
                              : IconButton(
                                  iconSize: 54,
                                  onPressed: _play,
                                  icon: const Icon(
                                    Icons.play_circle_fill,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ],
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${Fmt.cap(p.propertyType)} · PPC-${p.ppcId}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  p.locationLine,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  p.priceLabel,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tealDark,
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
