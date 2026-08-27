import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../routes.dart';
import '../../services/auth_service.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/web_form_fields.dart';

/// AddProps.jsx — the six-step "add property" wizard.
///
/// The web version reserves a PPC-ID up front via `/store-data`, then PATCHes
/// the growing form to `/update-property` at the end of every step (so a
/// half-finished listing is never lost). This does the same.
class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _form = <String, dynamic>{'countryCode': '+91', 'country': 'India'};
  final _photos = <XFile>[];
  final _videos = <XFile>[];
  final _picker = ImagePicker();

  String? _ppcId;
  Map<String, List<String>> _options = const {};
  int _step = 0;
  bool _busy = false;
  bool _submitted = false;
  String? _bootError;

  /// Property types where the "features" step makes no sense (AddProps.jsx).
  static const List<String> _plotTypes = ['Plot', 'Land', 'Agricultural Land'];

  /// `requiredFieldsByStep` from AddProperty.jsx, zero-based here because its
  /// steps count from 1.
  ///
  /// AddProps.jsx additionally requires `state, city, area, pinCode` on the
  /// address step, but AddProperty.jsx — the form the app actually opens — does
  /// not, so the address stays optional to match it.
  static const Map<int, List<String>> _required = {
    0: ['propertyMode', 'propertyType', 'price'],
    1: ['totalArea', 'areaUnit'],
    3: ['salesType', 'postedBy'],
  };

  /// Verbatim section headings from AddProperty.jsx (`stepRefs[1..7]`), which
  /// is the form every menu in the web app actually opens — not AddProps.jsx.
  static const List<String> _stepTitles = [
    'Property Overview',
    'Basic Property Info',
    'Property details',
    'Other Details',
    'Property Description',
    'Property Address',
    'Owner Details',
  ];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      setState(() => _bootError = 'Please log in to add a property.');
      return;
    }
    _form['phoneNumber'] = session.phoneDigits;
    AuthService.recordView(session.phoneNumber, 'Add Property');

    setState(() => _busy = true);
    try {
      final results = await Future.wait([
        PropertyService.reservePpcId(session.phoneNumber!),
        PropertyService.fetchDropdowns().catchError(
          (_) => <String, List<String>>{},
        ),
      ]);
      if (!mounted) return;
      setState(() {
        _ppcId = results[0] as String;
        _options = results[1] as Map<String, List<String>>;
        _busy = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bootError = describeError(e);
        _busy = false;
      });
    }
  }

  bool get _isPlot => _plotTypes.contains(_form['propertyType']);

  /// Step 2 (features) is skipped entirely for plots/land.
  bool _isStepVisible(int step) => !(step == 2 && _isPlot);

  List<String> _missingFor(int step) {
    final required = _required[step] ?? const [];
    return required
        .where((f) => (_form[f]?.toString().trim() ?? '').isEmpty)
        .toList();
  }

  Future<void> _next() async {
    final missing = _missingFor(_step);
    if (missing.isNotEmpty) {
      showToast(
        context,
        'Please fill: ${missing.map(_pretty).join(', ')}',
        error: true,
      );
      return;
    }
    await _save(advance: true);
  }

  /// The web gets this free from Google Places (`place.formatted_address`).
  /// There is no Places autocomplete here, so compose the same single-line
  /// address from the parts the user typed rather than leave the column empty.
  void _composeRentalAddress() {
    final parts = [
      'doorNumber',
      'streetName',
      'nagar',
      'area',
      'city',
      'district',
      'state',
      'pinCode',
    ]
        .map((k) => _form[k]?.toString().trim() ?? '')
        .where((v) => v.isNotEmpty)
        .toList();
    if (parts.isNotEmpty) _form['rentalPropertyAddress'] = parts.join(', ');
  }

  Future<void> _save({required bool advance}) async {
    if (_ppcId == null) return;
    _composeRentalAddress();
    setState(() => _busy = true);
    try {
      await PropertyService.updateProperty(
        ppcId: _ppcId!,
        fields: _form,
        photos: await _multipart(_photos),
        videos: await _multipart(_videos),
      );
      if (!mounted) return;
      if (advance) {
        // Photos/videos are uploaded once; don't resend them on later steps.
        _photos.clear();
        _videos.clear();
        var next = _step + 1;
        while (next < _stepTitles.length && !_isStepVisible(next)) {
          next++;
        }
        setState(() => _step = next.clamp(0, _stepTitles.length - 1));
      }
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<List<MultipartFile>> _multipart(List<XFile> files) async {
    return Future.wait(files.map(
      (f) => MultipartFile.fromFile(f.path, filename: f.name),
    ));
  }

  Future<void> _submit() async {
    final missing = _missingFor(5);
    if (missing.isNotEmpty) {
      showToast(
        context,
        'Please complete the location step first.',
        error: true,
      );
      setState(() => _step = 5);
      return;
    }
    final ok = await confirmDialog(
      context,
      title: 'Submit property',
      message:
          'Submit PPC-ID $_ppcId for review? Our team will verify and publish it.',
      yes: 'Yes, Continue',
      no: 'Cancel',
    );
    if (!ok) return;
    await _save(advance: false);
    if (!mounted) return;
    setState(() => _submitted = true);
  }

  void _back() {
    var prev = _step - 1;
    while (prev > 0 && !_isStepVisible(prev)) {
      prev--;
    }
    setState(() => _step = prev.clamp(0, _stepTitles.length - 1));
  }

  static String _pretty(String field) => field
      .replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m.group(1)}')
      .replaceFirstMapped(RegExp(r'^\w'), (m) => m.group(0)!.toUpperCase());

  // ───────────────────────── build ─────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      // AddProperty.jsx's sticky strip: flat #EFEFEF with a teal back arrow and
      // an 18px <h3>. The PPC-ID moves out of the title and into the teal band
      // below, where the web shows it.
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
        title: const Text(
          'Add Property',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.text,
          ),
        ),
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (_bootError != null) {
      return ErrorState(message: _bootError!, onRetry: _bootstrap);
    }
    if (_ppcId == null) return const AppLoader(label: 'Preparing your listing…');
    if (_submitted) return _successView();

    return Column(
      children: [
        _progress(),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              // <h4>123 Property Management</h4> — bold near-black, above the
              // teal PPC-ID band.
              const Text(
                '123 Property Management',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0A0A0A),
                ),
              ),
              const SizedBox(height: 10),
              // <p className="p-3" style={{color:white, background:rgb(47,116,127)}}>
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                color: AppColors.tealDark,
                child: Text(
                  'PPC-ID: $_ppcId',
                  style: const TextStyle(fontSize: 15, color: Colors.white),
                ),
              ),
              const SizedBox(height: 14),
              // Each web step heading is
              // <h4 style={{color:"rgb(47,116,127)", fontWeight:"bold",
              //             marginBottom:"10px"}}> — rgb(47,116,127) is
              // tealDark, a shade off the teal used elsewhere. Bootstrap's h4
              // resolves to ~21px at this viewport via RFS.
              Text(
                _stepTitles[_step],
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.tealDark,
                ),
              ),
              const SizedBox(height: 10), // h4 { margin-bottom: 10px }
              ..._stepFields(),
            ],
          ),
        ),
        _footer(),
      ],
    );
  }

  Widget _progress() {
    final total = _stepTitles.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Step ${_step + 1} of $total',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (_step + 1) / total,
              minHeight: 5,
              backgroundColor: const Color(0xFFEDEDED),
              valueColor: const AlwaysStoppedAnimation(AppColors.teal),
            ),
          ),
        ],
      ),
    );
  }

  /// The review-step button pair from AddProperty.jsx: a pill-shaped outlined
  /// EDIT in #1882F6 and a wider gradient SUBMIT
  /// (`linear-gradient(145deg,#4a90e2,#007bff)`), both 40px tall on a 25px
  /// radius with the same inset highlight + drop shadow.
  Widget _footer() {
    final isLast = _step == _stepTitles.length - 1;
    const blue = Color(0xFF1882F6);
    const shadow = [
      BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 4)),
    ];

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Row(
          children: [
            if (_step > 0) ...[
              GestureDetector(
                onTap: _busy ? null : _back,
                child: Container(
                  width: 90,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    border: Border.all(color: blue, width: 2),
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: shadow,
                  ),
                  child: const Text(
                    'BACK',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: blue,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 20),
            ],
            Expanded(
              child: GestureDetector(
                onTap: _busy ? null : (isLast ? _submit : _next),
                child: Container(
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4A90E2), Color(0xFF007BFF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: shadow,
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
                      : Text(
                          isLast ? 'SUBMIT PROPERTY' : 'SAVE & CONTINUE',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
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
              height: 140,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.check_circle,
                size: 90,
                color: Color(0xFF2E7D32),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Property submitted!',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Your PPC-ID is $_ppcId. Our team will verify the details and '
              'publish your listing shortly.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.pricingPlans,
                arguments: _ppcId,
              ),
              style: FilledButton.styleFrom(backgroundColor: AppColors.teal),
              child: const Text('Choose a plan to publish faster'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back to my properties'),
            ),
          ],
        ),
      ),
    );
  }

  // ───────────────────────── step fields ─────────────────────────

  /// Dial-code selector sitting in front of a phone field. The web keeps these
  /// as their own form values (`phoneNumberCountryCode` /
  /// `alternatePhoneCountryCode`) rather than baking them into the number.
  Widget _dialCode(String key) {
    const codes = ['+91', '+1', '+44', '+61', '+65', '+971', '+966', '+60'];
    final current = (_form[key]?.toString() ?? '+91');
    return DropdownButtonFormField<String>(
      initialValue: codes.contains(current) ? current : codes.first,
      isExpanded: true,
      decoration: const InputDecoration(labelText: 'Code'),
      items: codes
          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
          .toList(),
      onChanged: (v) => setState(() => _form[key] = v),
    );
  }

  List<Widget> _stepFields() {
    switch (_step) {
      case 0:
        return [
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
          _number('price', 'Expected Price (₹) *', helper: _priceHelper()),
          _dropdown('propertyAge', 'Property Age',
              _optionsFor('propertyAge', const ['New', '0-5 Years', '5-10 Years', '10+ Years'])),
        ];
      case 1:
        return [
          _number('length', 'Length'),
          _number('breadth', 'Breadth'),
          _number('totalArea', 'Total Area *'),
          _dropdown('areaUnit', 'Area Unit *',
              _optionsFor('areaUnit', const ['Sqft', 'Sqm', 'Cent', 'Acre', 'Ground'])),
          _dropdown('ownership', 'Ownership',
              _optionsFor('ownership', const ['Single Owner', 'Joint Owner', 'Builder'])),
          _dropdown('propertyApproved', 'Property Approved',
              _optionsFor('propertyApproved', const ['DTCP', 'CMDA', 'Panchayat', 'Not Approved'])),
          _dropdown('bankLoan', 'Bank Loan',
              _optionsFor('bankLoan', const ['Yes', 'No'])),
          _dropdown('negotiation', 'Negotiation',
              _optionsFor('negotiation', const ['Yes', 'No'])),
        ];
      case 2:
        return [
          _dropdown('bedrooms', 'Bedrooms (BHK)',
              _optionsFor('bedrooms', const ['1', '2', '3', '4', '5', '6'])),
          _dropdown('kitchen', 'Kitchen',
              _optionsFor('kitchen', const ['1', '2', '3'])),
          _dropdown('kitchenType', 'Kitchen Type',
              _optionsFor('kitchenType', const ['Modular', 'Normal'])),
          _dropdown('balconies', 'Balconies',
              _optionsFor('balconies', const ['0', '1', '2', '3'])),
          _dropdown('floorNo', 'Floor No',
              _optionsFor('floorNo', const ['0', '1', '2', '3', '4', '5'])),
          _dropdown('numberOfFloors', 'Number of Floors',
              _optionsFor('numberOfFloors', const ['1', '2', '3', '4', '5'])),
          _dropdown('attachedBathrooms', 'Attached Bathrooms',
              _optionsFor('attachedBathrooms', const ['1', '2', '3', '4'])),
          _dropdown('western', 'Western Toilets',
              _optionsFor('western', const ['1', '2', '3', '4'])),
          _dropdown('carParking', 'Car Parking',
              _optionsFor('carParking', const ['Yes', 'No', '1', '2'])),
          _dropdown('lift', 'Lift', _optionsFor('lift', const ['Yes', 'No'])),
        ];
      case 3:
        return [
          _dropdown('salesType', 'Sales Type *',
              _optionsFor('salesType', const ['Direct', 'Broker', 'Agent'])),
          _dropdown('postedBy', 'Posted By *',
              _optionsFor('postedBy', const ['Owner', 'Agent', 'Builder'])),
          _dropdown('salesMode', 'Sales Mode',
              _optionsFor('salesMode', const ['Direct Sale', 'Resale', 'New'])),
          _dropdown('furnished', 'Furnished',
              _optionsFor('furnished', const ['Furnished', 'Semi Furnished', 'Unfurnished'])),
          _dropdown(
              'facing',
              'Facing',
              _optionsFor('facing', const [
                'East',
                'West',
                'North',
                'South',
                'North East',
                'North West',
                'South East',
                'South West',
              ])),
        ];
      case 4:
        return [
          _mediaPicker(),
          const SizedBox(height: 8),
          _text('description', 'Description', maxLines: 5),
        ];
      case 5:
        return [
          _text('country', 'Country'),
          _text('state', 'State *'),
          _text('district', 'District'),
          _text('city', 'City *'),
          _text('nagar', 'Nagar'),
          _text('area', 'Area *'),
          _text('streetName', 'Street Name'),
          _text('doorNumber', 'Door Number'),
          _number('pinCode', 'Pin Code *'),
          _text(
            'locationCoordinates',
            'Map Coordinates (latitude,longitude)',
            hint: '11.9416,79.8083',
          ),
        ];
      default:
        return [
          _text('ownerName', 'Owner Name'),
          _text('email', 'Email', keyboard: TextInputType.emailAddress),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 96, child: _dialCode('phoneNumberCountryCode')),
              const SizedBox(width: 10),
              Expanded(child: _number('phoneNumber', 'Contact Number')),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 96, child: _dialCode('alternatePhoneCountryCode')),
              const SizedBox(width: 10),
              Expanded(child: _number('alternatePhone', 'Alternate Number')),
            ],
          ),
          _dropdown(
              'bestTimeToCall',
              'Best Time To Call',
              _optionsFor('bestTimeToCall', const [
                'Morning (9AM - 12PM)',
                'Afternoon (12PM - 4PM)',
                'Evening (4PM - 8PM)',
                'Anytime',
              ])),
        ];
    }
  }

  /// Backend dropdown values when available, otherwise sensible defaults.
  List<String> _optionsFor(String field, List<String> fallback) {
    final remote = _options[field];
    return (remote == null || remote.isEmpty) ? fallback : remote;
  }

  String? _priceHelper() {
    final raw = _form['price']?.toString();
    final value = num.tryParse(raw ?? '');
    if (value == null || value <= 0) return null;
    return Fmt.price(value);
  }

  /// True when the web marks this field with a red asterisk, i.e. it appears in
  /// `requiredFieldsByStep` for the step it lives on.
  bool _isRequired(String key) =>
      _required.values.any((fields) => fields.contains(key));

  /// Strips the `*` suffix the old builders carried in their label text — the
  /// asterisk is now drawn by [WebFieldLabel] in red, as the web does.
  static String _bareLabel(String label) =>
      label.replaceAll('*', '').trimRight();

  /// Every field carries a ValueKey of its form key. _stepFields() spreads a
  /// different list into the same Column on each step, so without keys Flutter
  /// matches children by index+type and hands one step's TextFormField state to
  /// the field sitting at the same index on the next step — step 1's price box
  /// (index 2) fed its typed text straight into step 2's Total Area (index 2),
  /// which then LOOKED filled while _form['totalArea'] was still empty and the
  /// required-field check rejected the step. initialValue is only read when the
  /// element is first created, so the keys are what keep _form authoritative.
  Widget _text(
    String key,
    String label, {
    int maxLines = 1,
    String? hint,
    TextInputType? keyboard,
    IconData? icon,
  }) {
    return WebTextField(
      key: ValueKey(key),
      label: _bareLabel(label),
      required: _isRequired(key),
      value: _form[key]?.toString(),
      hint: hint,
      icon: icon,
      maxLines: maxLines,
      keyboard: keyboard,
      onChanged: (v) => _form[key] = v.trim(),
    );
  }

  Widget _number(String key, String label, {String? helper, IconData? icon}) {
    return WebTextField(
      key: ValueKey(key),
      label: _bareLabel(label),
      required: _isRequired(key),
      value: _form[key]?.toString(),
      hint: helper,
      icon: icon,
      numeric: true,
      onChanged: (v) => setState(() => _form[key] = v.trim()),
    );
  }

  Widget _dropdown(String key, String label, List<String> options) {
    final bare = _bareLabel(label);
    return WebDropdownField(
      key: ValueKey(key),
      label: bare,
      required: _isRequired(key),
      value: _form[key]?.toString(),
      options: options,
      placeholder: 'Select $bare',
      onChanged: (v) => setState(() => _form[key] = v),
    );
  }

  Widget _mediaPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Photos',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._photos.map(
              (f) => Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.file(
                      File(f.path),
                      width: 84,
                      height: 84,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: GestureDetector(
                      onTap: () => setState(() => _photos.remove(f)),
                      child: const CircleAvatar(
                        radius: 10,
                        backgroundColor: Colors.black54,
                        child: Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            _addTile(
              icon: Icons.add_a_photo_outlined,
              label: 'Add',
              onTap: () async {
                final picked = await _picker.pickMultiImage(imageQuality: 70);
                if (picked.isNotEmpty) setState(() => _photos.addAll(picked));
              },
            ),
          ],
        ),
        const SizedBox(height: 18),
        const Text(
          'Video (optional)',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._videos.map(
              (f) => Chip(
                label: Text(
                  f.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11),
                ),
                onDeleted: () => setState(() => _videos.remove(f)),
              ),
            ),
            _addTile(
              icon: Icons.videocam_outlined,
              label: 'Video',
              onTap: () async {
                final picked =
                    await _picker.pickVideo(source: ImageSource.gallery);
                if (picked != null) setState(() => _videos.add(picked));
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _addTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 84,
        height: 84,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.tealSoft, style: BorderStyle.solid),
          color: AppColors.searchTop,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.teal),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: AppColors.tealDark),
            ),
          ],
        ),
      ),
    );
  }
}
