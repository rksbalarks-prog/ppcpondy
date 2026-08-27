import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../routes.dart';
import '../../services/auth_service.dart';
import '../../services/buyer_service.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/web_form_fields.dart';

/// BuyerAssistance.jsx / EditBuyerAssistance.jsx — "tell us what you're looking
/// for" so owners with matching properties can reach out.
class BuyerAssistanceFormScreen extends StatefulWidget {
  const BuyerAssistanceFormScreen({
    super.key,
    this.existing,
    this.embedded = false,
  });

  /// Raw record when editing; null when creating.
  final Map<String, dynamic>? existing;
  final bool embedded;

  @override
  State<BuyerAssistanceFormScreen> createState() =>
      _BuyerAssistanceFormScreenState();
}

class _BuyerAssistanceFormScreenState extends State<BuyerAssistanceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _form = <String, dynamic>{};

  Map<String, List<String>> _options = const {};
  bool _busy = false;
  bool _submitted = false;

  /// Budget presets shared with the feed filters.
  static const List<num> _priceSteps = [
    500000,
    1000000,
    1500000,
    2000000,
    2500000,
    3000000,
    4000000,
    5000000,
    7500000,
    10000000,
    15000000,
    20000000,
    50000000,
  ];

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    if (existing != null) _form.addAll(existing);

    final session = context.read<SessionProvider>();
    _form['phoneNumber'] ??= session.phoneDigits;
    AuthService.recordView(session.phoneNumber, 'Buyer Assistance');
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    try {
      final options = await PropertyService.fetchDropdowns();
      if (mounted) setState(() => _options = options);
    } catch (_) {
      /* fall back to the built-in lists */
    }
  }

  List<String> _optionsFor(String field, List<String> fallback) {
    final remote = _options[field];
    return (remote == null || remote.isEmpty) ? fallback : remote;
  }

  bool get _isEdit => widget.existing != null;

  Future<void> _submit() async {
    // Same required set the web validates before POSTing.
    const required = {
      'baName': 'Name',
      'phoneNumber': 'Phone Number',
      'state': 'State',
      'propertyType': 'Property Type',
      'propertyMode': 'Property Mode',
      'minPrice': 'Min Price',
      'maxPrice': 'Max Price',
      'area': 'Area',
      'pinCode': 'Pin Code',
    };
    final missing = required.entries
        .where((e) => (_form[e.key]?.toString().trim() ?? '').isEmpty)
        .map((e) => e.value)
        .toList();
    if (missing.isNotEmpty) {
      await _showValidationPopup(
        missing.map((m) => '$m is required').toList(),
      );
      return;
    }

    final min = num.tryParse('${_form['minPrice']}') ?? 0;
    final max = num.tryParse('${_form['maxPrice']}') ?? 0;
    if (max < min) {
      await _showValidationPopup(
        const ['Max price must be greater than min price.'],
      );
      return;
    }

    // "Do you want to create assistance?" — the web asks before POSTing.
    if (!_isEdit) {
      final go = await _showCreateConfirm();
      if (!go || !mounted) return;
    }

    setState(() => _busy = true);
    try {
      // The backend stores "N/A" for blanks (autoFillWithNA on the web).
      final payload = <String, dynamic>{
        for (final key in _fieldKeys)
          key: (_form[key]?.toString().trim().isEmpty ?? true)
              ? 'N/A'
              : _form[key],
      };
      payload['pincode'] = payload['pinCode'];

      if (_isEdit) {
        final baId = widget.existing!['ba_id']?.toString() ??
            widget.existing!['_id']?.toString() ??
            '';
        await BuyerService.update(baId, payload);
      } else {
        await BuyerService.create(payload);
      }
      if (!mounted) return;
      setState(() => _submitted = true);
      showToast(
        context,
        _isEdit ? 'Requirement updated.' : 'Requirement submitted.',
      );
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  static const List<String> _fieldKeys = [
    'baName',
    'phoneNumber',
    'altPhoneNumber',
    'city',
    'area',
    'pinCode',
    'state',
    'loanInput',
    'minPrice',
    'maxPrice',
    'totalArea',
    'areaUnit',
    'bedrooms',
    'propertyMode',
    'propertyType',
    'propertyAge',
    'bankLoan',
    'propertyApproved',
    'facing',
    'paymentType',
    'description',
  ];

  @override
  Widget build(BuildContext context) {
    final body = _body();
    if (widget.embedded) return body;
    // BuyerAssistance.jsx's sticky strip: flat #EFEFEF, teal back arrow, and a
    // 20px title — same chrome the detail page uses.
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppColors.detailHeaderBg,
        surfaceTintColor: AppColors.detailHeaderBg,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          onPressed: () => Navigator.maybePop(context),
          icon: const Icon(Icons.arrow_back, size: 20, color: AppColors.teal),
          tooltip: 'Back',
        ),
        title: Text(
          _isEdit ? 'Edit Requirement' : 'Buyer Assistance',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppColors.text,
          ),
        ),
      ),
      body: body,
    );
  }

  Widget _body() {
    if (_submitted) return _successView();

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 30),
        children: [
          _banner(),
          _topActions(),
          // The web repeats the page name as a small teal form title.
          const Padding(
            padding: EdgeInsets.only(top: 8, bottom: 4),
            child: Text(
              'Buyer Assistance',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.tealDark,
              ),
            ),
          ),
          _intro(),
          const SizedBox(height: 18),
          _sectionLabel('Your details'),
          _text('baName', 'Your Name *'),
          _number('phoneNumber', 'Phone Number *'),
          _number('altPhoneNumber', 'Alternate Number'),
          _sectionLabel('What are you looking for?'),
          _dropdown('propertyMode', 'Property Mode *',
              _optionsFor('propertyMode', const ['Sale', 'Rent', 'Lease'])),
          _dropdown(
              'propertyType',
              'Property Type *',
              _optionsFor('propertyType', const [
                'Individual House',
                'Individual Villa',
                'Apartment',
                'Flat',
                'Plot',
                'Land',
                'Agricultural Land',
                'Commercial Building',
                'Commercial Shop',
              ])),
          _dropdown('bedrooms', 'Bedrooms (BHK)',
              _optionsFor('bedrooms', const ['1', '2', '3', '4', '5'])),
          _sectionLabel('Budget'),
          Row(
            children: [
              Expanded(child: _priceDropdown('minPrice', 'Min Price *')),
              const SizedBox(width: 10),
              Expanded(child: _priceDropdown('maxPrice', 'Max Price *')),
            ],
          ),
          const SizedBox(height: 14),
          _dropdown('paymentType', 'Payment Type',
              _optionsFor('paymentType', const ['Cash', 'Bank Loan', 'Both'])),
          _dropdown('bankLoan', 'Bank Loan Needed',
              _optionsFor('bankLoan', const ['Yes', 'No'])),
          _text('loanInput', 'Loan Amount / Notes'),
          _sectionLabel('Preferred location'),
          _text('state', 'State *'),
          _text('city', 'City'),
          _text('area', 'Area *'),
          _number('pinCode', 'Pin Code *'),
          _sectionLabel('Other preferences'),
          Row(
            children: [
              Expanded(child: _number('totalArea', 'Total Area')),
              const SizedBox(width: 10),
              Expanded(
                child: _dropdown('areaUnit', 'Unit',
                    _optionsFor('areaUnit', const ['Sqft', 'Sqm', 'Cent', 'Acre'])),
              ),
            ],
          ),
          _dropdown('propertyAge', 'Property Age',
              _optionsFor('propertyAge', const ['New', '0-5 Years', '5-10 Years', '10+ Years'])),
          _dropdown('propertyApproved', 'Property Approved',
              _optionsFor('propertyApproved', const ['DTCP', 'CMDA', 'Panchayat', 'Any'])),
          _dropdown(
              'facing',
              'Facing',
              _optionsFor('facing', const [
                'East',
                'West',
                'North',
                'South',
                'Any',
              ])),
          _text('description', 'Anything else we should know?', maxLines: 4),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _busy ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.teal,
              padding: const EdgeInsets.symmetric(vertical: 15),
            ),
            child: _busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(_isEdit ? 'UPDATE REQUIREMENT' : 'SUBMIT REQUIREMENT'),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () =>
                Navigator.pushNamed(context, AppRoutes.myBuyerAssistance),
            child: const Text('View my requirements'),
          ),
        ],
      ),
    );
  }

  /// BuyerAssistance.jsx's `showPopup` modal — a #FFE8E8 card listing every
  /// unfilled required field in #E74C3C, with a matching full-width Close.
  Future<void> _showValidationPopup(List<String> errors) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFFFFE8E8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Expanded(
                    child: Text(
                      'Please complete required fields:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFE74C3C),
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: const Text(
                      '×',
                      style: TextStyle(
                        fontSize: 24,
                        height: 1,
                        color: Color(0xFFE74C3C),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              for (final e in errors)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(
                    '•  $e',
                    style: const TextStyle(
                        fontSize: 14, color: Color(0xFFE74C3C)),
                  ),
                ),
              const SizedBox(height: 4),
              FilledButton(
                onPressed: () => Navigator.pop(ctx),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFE74C3C),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4)),
                ),
                child: const Text(
                  'Close',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// `showConfirmPopup` — "Do you want to create assistance?" with the web's
  /// #6CBAAF confirm and grey dismiss, split evenly.
  Future<bool> _showCreateConfirm() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 40),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Do you want to create assistance?',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF6CBAAF),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4)),
                      ),
                      child: const Text('Yes, help me'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFCCCCCC),
                        foregroundColor: const Color(0xFF333333),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4)),
                      ),
                      child: const Text('No'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    return result ?? false;
  }

  /// `<img src={ppbuyer} className="header-image" style={{width:'100%'}}/>` —
  /// the full-bleed banner directly under the header.
  Widget _banner() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Image.asset(
        'assets/images/ppbuyer.png',
        width: double.infinity,
        fit: BoxFit.fitWidth,
        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
      ),
    );
  }

  /// The pair of #019988 buttons the web puts under the banner. "Add Buyer
  /// Assistant" is the page you are already on, so it stays disabled at 60%
  /// opacity exactly as the web renders it.
  Widget _topActions() {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Opacity(
            opacity: 0.6,
            child: _pillButton('Add Buyer Assistant', null),
          ),
          _pillButton(
            'View Buyer List',
            () => Navigator.pushNamed(context, AppRoutes.myBuyerAssistance),
          ),
        ],
      ),
    );
  }

  Widget _pillButton(String label, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.galleryNav, // #019988
          borderRadius: BorderRadius.circular(5),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.white),
        ),
      ),
    );
  }

  Widget _intro() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.searchTop, AppColors.searchBottom],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.searchBorder),
      ),
      child: const Row(
        children: [
          Icon(Icons.support_agent, color: AppColors.teal, size: 30),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Tell us what you need and owners with matching properties will '
              'reach out to you directly.',
              style: TextStyle(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _successView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/success.png',
              height: 130,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.check_circle,
                size: 84,
                color: Color(0xFF2E7D32),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Requirement saved!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'We will notify you as soon as a matching property is listed.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () =>
                  Navigator.pushNamed(context, AppRoutes.myBuyerAssistance),
              style: FilledButton.styleFrom(backgroundColor: AppColors.teal),
              child: const Text('View my requirements'),
            ),
            TextButton(
              onPressed: () => setState(() {
                _submitted = false;
                _form.clear();
                _form['phoneNumber'] =
                    context.read<SessionProvider>().phoneDigits;
              }),
              child: const Text('Add another requirement'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 10),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.teal,
          ),
        ),
      );

  /// Fields BuyerAssistance.jsx marks with a red asterisk — the same set
  /// [_submit] validates before POSTing.
  static const Set<String> _requiredKeys = {
    'baName',
    'phoneNumber',
    'state',
    'propertyType',
    'propertyMode',
    'minPrice',
    'maxPrice',
    'area',
    'pinCode',
  };

  static String _bareLabel(String label) =>
      label.replaceAll('*', '').trimRight();

  /// Keyed by form key so a TextFormField's state can never be reused by a
  /// different field if this list ever becomes conditional — the failure mode
  /// that made Add Property's Total Area look filled while _form was empty.
  Widget _text(String key, String label, {int maxLines = 1}) => WebTextField(
        key: ValueKey(key),
        label: _bareLabel(label),
        required: _requiredKeys.contains(key),
        value: _form[key]?.toString(),
        maxLines: maxLines,
        onChanged: (v) => _form[key] = v.trim(),
      );

  Widget _number(String key, String label) => WebTextField(
        key: ValueKey(key),
        label: _bareLabel(label),
        required: _requiredKeys.contains(key),
        value: _form[key]?.toString(),
        numeric: true,
        onChanged: (v) => _form[key] = v.trim(),
      );

  Widget _dropdown(String key, String label, List<String> options) {
    final bare = _bareLabel(label);
    return WebDropdownField(
      key: ValueKey(key),
      label: bare,
      required: _requiredKeys.contains(key),
      value: _form[key]?.toString(),
      options: options,
      placeholder: 'Select $bare',
      onChanged: (v) => setState(() => _form[key] = v),
    );
  }

  /// Budget pickers show formatted rupee amounts but store the raw number.
  Widget _priceDropdown(String key, String label) {
    final bare = _bareLabel(label);
    final labels = {for (final p in _priceSteps) Fmt.price(p): p};
    final current = num.tryParse('${_form[key]}');
    return WebDropdownField(
      key: ValueKey(key),
      label: bare,
      required: _requiredKeys.contains(key),
      value: current == null ? null : Fmt.price(current),
      options: labels.keys.toList(),
      placeholder: 'Select $bare',
      icon: Icons.currency_rupee,
      onChanged: (v) =>
          setState(() => _form[key] = labels[v]?.toString()),
    );
  }
}
