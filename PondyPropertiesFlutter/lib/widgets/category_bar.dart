import 'package:flutter/material.dart';

import '../core/theme.dart';

/// One entry in the horizontally-scrolling category strip.
class CategoryItem {
  const CategoryItem({required this.id, required this.label, required this.asset});

  final String id;
  final String label;
  final String asset;
}

/// TopBar.jsx — the icon strip under the navbar. The web version clones its
/// items 10× to fake infinite scrolling; a real ListView with a large repeat
/// count and a centred initial offset gives the same feel without the
/// scroll-position hacks.
class CategoryBar extends StatefulWidget {
  const CategoryBar({
    super.key,
    required this.items,
    required this.activeId,
    required this.onSelect,
  });

  final List<CategoryItem> items;
  final String activeId;
  final ValueChanged<String> onSelect;

  @override
  State<CategoryBar> createState() => _CategoryBarState();
}

class _CategoryBarState extends State<CategoryBar> {
  static const int _repeats = 10;
  late final ScrollController _controller;

  @override
  void initState() {
    super.initState();
    _controller = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _centre());
  }

  /// Start in the middle of the repeated strip so the user can scroll both ways.
  void _centre() {
    if (!_controller.hasClients) return;
    final max = _controller.position.maxScrollExtent;
    if (max > 0) _controller.jumpTo(max / 2);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final count = widget.items.length * _repeats;

    return Container(
      height: 56,
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 4)),
        ],
      ),
      child: ListView.builder(
        controller: _controller,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        itemCount: count,
        itemBuilder: (context, index) {
          final item = widget.items[index % widget.items.length];
          final active = item.id == widget.activeId;
          return InkWell(
            onTap: () => widget.onSelect(item.id),
            child: Container(
              width: 76,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    item.asset,
                    width: 28,
                    height: 28,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.home_work_outlined,
                      size: 26,
                      color: AppColors.teal,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.only(bottom: 3),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          width: 2,
                          color: active ? const Color(0xFF383838) : Colors.transparent,
                        ),
                      ),
                    ),
                    child: Text(
                      item.label,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                        color: active ? const Color(0xFF2F4F4F) : Colors.grey,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
