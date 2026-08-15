import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../models/buyer_assistance.dart';
import '../../routes.dart';
import '../../services/auth_service.dart';
import '../../services/buyer_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/buyer_card.dart';
import '../../widgets/common.dart';

/// BuyerLists.jsx / BuyerList.jsx — the public list of buyer requirements an
/// owner can browse and contact.
class BuyerListScreen extends StatefulWidget {
  const BuyerListScreen({super.key, this.standalone = false});

  final bool standalone;

  @override
  State<BuyerListScreen> createState() => _BuyerListScreenState();
}

class _BuyerListScreenState extends State<BuyerListScreen> {
  final _searchController = TextEditingController();

  List<BuyerAssistance> _items = const [];
  bool _loading = true;
  bool _hasAccess = false;
  String? _error;
  String _query = '';
  String? _modeFilter;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AuthService.recordView(
        context.read<SessionProvider>().phoneNumber,
        'Buyer List',
      );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final session = context.read<SessionProvider>();
      final items = await BuyerService.fetchActive();
      final access = session.isLoggedIn
          ? await BuyerService.hasBuyerAccess(session.phoneNumber!)
          : false;
      if (!mounted) return;
      setState(() {
        _items = items;
        _hasAccess = access;
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

  List<BuyerAssistance> get _filtered {
    var items = _items;
    final q = _query.trim().toLowerCase();
    if (q.isNotEmpty) {
      items = items.where((b) {
        final haystack = [
          b.baId,
          b.name,
          b.area,
          b.city,
          b.state,
          b.pincode,
          b.propertyType,
          b.propertyMode,
        ].whereType<String>().join(' ').toLowerCase();
        return haystack.contains(q);
      }).toList();
    }
    if (_modeFilter != null) {
      items = items
          .where((b) =>
              (b.propertyMode ?? '').toLowerCase() == _modeFilter!.toLowerCase())
          .toList();
    }
    return items;
  }

  Future<void> _contact(BuyerAssistance buyer) async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      showToast(context, 'Please log in first.', error: true);
      return;
    }
    if (!_hasAccess) {
      final buy = await confirmDialog(
        context,
        title: 'Buyer contact locked',
        message:
            'Your current plan does not include buyer contact details. View the '
            'Buyer Assistant plans?',
        yes: 'View plans',
        no: 'Not now',
      );
      if (buy && mounted) {
        Navigator.pushNamed(context, AppRoutes.buyerPlans);
      }
      return;
    }

    final number = buyer.displayContact;
    if (number == null) {
      showToast(context, 'No contact number available.', error: true);
      return;
    }
    try {
      await BuyerService.contactBuyer(
        phoneNumber: session.phoneNumber!,
        buyerPhoneNumber: number,
        baId: buyer.baId,
      );
    } catch (_) {
      /* logging the contact must not block the call */
    }
    if (mounted) await dialPhone(context, number);
  }

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (!widget.standalone) return body;
    return Scaffold(
      appBar: AppBar(title: const Text('Buyer List')),
      body: body,
    );
  }

  Widget _body() {
    if (_loading) return const AppLoader(label: 'Loading buyers…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);

    final items = _filtered;
    return Column(
      children: [
        _searchRow(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: items.isEmpty
                ? ListView(
                    children: const [
                      SizedBox(height: 50),
                      EmptyState(message: 'No buyer requirements found.'),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(top: 8, bottom: 24),
                    itemCount: items.length,
                    itemBuilder: (_, i) => BuyerCard(
                      buyer: items[i],
                      contactLocked: !_hasAccess,
                      onContact: () => _contact(items[i]),
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.buyerAssistanceDetail,
                        arguments: items[i].baId,
                      ),
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _searchRow() {
    final modes = _items
        .map((b) => b.propertyMode)
        .whereType<String>()
        .toSet()
        .toList()
      ..sort();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
          child: TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(
              hintText: 'Search buyer, area or BA-ID',
              prefixIcon: const Icon(Icons.search, size: 19, color: AppColors.tealDark),
              suffixIcon: _query.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: AppColors.searchBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: AppColors.searchBorder),
              ),
            ),
          ),
        ),
        if (modes.isNotEmpty)
          SizedBox(
            height: 42,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text('All (${_items.length})',
                        style: const TextStyle(fontSize: 12)),
                    selected: _modeFilter == null,
                    onSelected: (_) => setState(() => _modeFilter = null),
                    selectedColor: AppColors.searchBottom,
                    side: const BorderSide(color: Color(0xFFDDDDDD)),
                  ),
                ),
                ...modes.map((m) {
                  final count =
                      _items.where((b) => b.propertyMode == m).length;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('${Fmt.cap(m)} ($count)',
                          style: const TextStyle(fontSize: 12)),
                      selected: _modeFilter == m,
                      onSelected: (_) => setState(
                        () => _modeFilter = _modeFilter == m ? null : m,
                      ),
                      selectedColor: AppColors.searchBottom,
                      side: const BorderSide(color: Color(0xFFDDDDDD)),
                    ),
                  );
                }),
              ],
            ),
          ),
      ],
    );
  }
}
