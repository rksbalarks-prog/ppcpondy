import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/city_base.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../routes.dart';
import '../services/auth_service.dart';
import '../state/session_provider.dart';
import '../widgets/common.dart';

/// Login.jsx — the three-step gate over a blurred hero image:
///   1. choose a city (Pondicherry / Chennai)
///   2. choose what you need (Property stays here / Rent hands off)
///   3. phone number → OTP → verify
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.forcedCity});

  /// Set from a city-locked entry point; hides step 1 and pins the base.
  final String? forcedCity;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const String _heroImage =
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcuV4KOIIk3EuvX9hVPSTszzfiPqalO5Oipbfm5wXCPVFgtWiFpMEiO3K2GpjuV87G61Y&usqp=CAU';

  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _phoneFocus = FocusNode();

  late String _selectedCity;
  String? _selectedType;

  String _countryCode = '+91';
  String _countryFlag = '🇮🇳';

  bool _otpSent = false;
  bool _busy = false;
  bool _agreed = true;
  int _timer = 30;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _selectedCity = widget.forcedCity ??
        (CityBase.active == 'CH' ? 'chennai' : 'pondicherry');
    if (widget.forcedCity != null) {
      CityBase.setActive(CityBase.fromCitySlug(widget.forcedCity!));
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _phoneController.dispose();
    _otpController.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  String get _fullPhone => '$_countryCode${_phoneController.text.trim()}';

  // ── step 1 ──────────────────────────────────────────────────────────────
  void _selectCity(String city) {
    setState(() {
      _selectedCity = city;
      _selectedType = null; // re-arm step 2, same as the web
    });
    CityBase.setActive(CityBase.fromCitySlug(city));
    context.read<SessionProvider>().switchCity(CityBase.fromCitySlug(city));
  }

  // ── step 2 ──────────────────────────────────────────────────────────────
  Future<void> _selectType(String type) async {
    if (type == 'rent') {
      final url = AppConfig.rentUrls[_selectedCity];
      if (url == null) {
        showToast(context, 'Rent app is coming soon!');
        return;
      }
      await launchExternal(context, url);
      return;
    }
    setState(() => _selectedType = type);
  }

  // ── step 3 ──────────────────────────────────────────────────────────────
  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      showToast(context, 'Please enter a valid phone number.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      // 1. Admin "direct verify" bypass — skip OTP entirely.
      if (await AuthService.isDirectVerified(phone)) {
        if (!mounted) return;
        showToast(context, 'User is directly verified. Logging in...');
        await _finishLogin(sendWelcome: false);
        return;
      }

      // 2. Normal flow: ask the backend for an OTP, then relay it on WhatsApp.
      //    The backend only echoes `result.otp` back when it is willing to let
      //    the client relay it; without it there is no WhatsApp copy to send.
      final otp = await AuthService.sendOtp(
        fullPhoneNumber: _fullPhone,
        countryCode: _countryCode,
      );
      final onWhatsApp = otp == null
          ? false
          : await AuthService.sendWhatsApp(phone, AuthService.otpMessage(otp));
      if (!mounted) return;
      // Only name the channels that actually accepted the message — claiming
      // WhatsApp when the relay failed sends people to hunt for a message that
      // was never delivered.
      showToast(
        context,
        onWhatsApp
            ? 'OTP sent! Check your WhatsApp and SMS.'
            : 'OTP sent by SMS. Check your messages.',
      );
      setState(() {
        _otpSent = true;
        _otpController.clear();
      });
      _startTimer();
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) {
      showToast(context, 'Please enter the OTP.', error: true);
      return;
    }
    if (!_agreed) {
      showToast(context, 'Please accept the terms & privacy policy.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await AuthService.verifyOtp(fullPhoneNumber: _fullPhone, otp: otp);
      if (!mounted) return;
      showToast(context, 'OTP verified successfully!');
      await _finishLogin(sendWelcome: true);
    } catch (e) {
      unawaited(AuthService.sendWhatsApp(
        _phoneController.text.trim(),
        AuthService.failedOtpMessage,
      ));
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _finishLogin({required bool sendWelcome}) async {
    if (sendWelcome) {
      unawaited(AuthService.sendWhatsApp(
        _phoneController.text.trim(),
        AuthService.loginSuccessMessage,
      ));
    }
    await context.read<SessionProvider>().signIn(_fullPhone);
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(
      context,
      AppRoutes.home,
      (_) => false,
      arguments: 'bottomHome',
    );
  }

  void _startTimer() {
    _ticker?.cancel();
    setState(() => _timer = 30);
    _ticker = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _timer--);
      if (_timer <= 0) t.cancel();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cityLabel = widget.forcedCity == null
        ? 'Pondicherry & Chennai'
        : CityBase.cityName(CityBase.fromCitySlug(widget.forcedCity!));

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            _heroImage,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: AppColors.teal),
          ),
          BackdropFilterScrim(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  const Text(
                    'Welcome Back',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Login to continue',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 34),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      'assets/images/ppc_logo.jpg',
                      height: 44,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.home_work, color: Colors.white, size: 40),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Property & Rentals',
                    style: TextStyle(color: Colors.white, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Buy, sell & rent in $cityLabel',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 28),
                  if (!_otpSent) ..._phoneStep() else ..._otpStep(),
                  const SizedBox(height: 34),
                  const Text.rich(
                    TextSpan(
                      style: TextStyle(color: Colors.white, fontSize: 13),
                      children: [
                        TextSpan(text: 'Buy, Sell & Rent  '),
                        TextSpan(
                          text: 'Property & Rentals',
                          style: TextStyle(
                            color: Color(0xFF16C616),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(width: 120, height: 2, color: AppColors.orangeRed),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── step 1 + 2 + phone entry ───────────────────────────────────────────
  List<Widget> _phoneStep() {
    return [
      if (widget.forcedCity == null) ...[
        _stepLabel('1', 'Choose your city', done: true),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _cityButton('pondicherry', 'Pondicherry')),
            const SizedBox(width: 8),
            Expanded(child: _cityButton('chennai', 'Chennai')),
          ],
        ),
        const SizedBox(height: 22),
      ],
      _stepLabel(widget.forcedCity == null ? '2' : '1', 'What do you need?'),
      const SizedBox(height: 8),
      Row(
        children: [
          Expanded(
            child: _typeButton(
              'property',
              _selectedCity == 'chennai' ? 'Chennai Property' : 'Pondy Property',
              'Buy & Sell',
              Icons.home_outlined,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _typeButton(
              'rent',
              _selectedCity == 'chennai' ? 'Rent Chennai' : 'Rent Pondy',
              'Rentals',
              Icons.vpn_key_outlined,
              external: true,
            ),
          ),
        ],
      ),
      if (_selectedType == null) ...[
        const SizedBox(height: 8),
        const Text(
          'Pick one to continue',
          style: TextStyle(color: Colors.white70, fontSize: 11),
        ),
      ],
      if (_selectedType == 'property') ...[
        const SizedBox(height: 26),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _countryPicker(),
            const SizedBox(width: 10),
            SizedBox(
              width: 150,
              child: TextField(
                controller: _phoneController,
                focusNode: _phoneFocus,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(15),
                ],
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(
                  hintText: 'Enter Mobile No',
                  hintStyle: TextStyle(color: Colors.white70),
                  filled: false,
                  border: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        _primaryButton('LOGIN', _sendOtp),
      ],
    ];
  }

  // ── OTP entry ──────────────────────────────────────────────────────────
  List<Widget> _otpStep() {
    final canResend = _timer <= 0;
    return [
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Login Number: ${_phoneController.text}',
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          TextButton.icon(
            onPressed: () {
              setState(() => _otpSent = false);
              _ticker?.cancel();
              Future<void>.delayed(
                const Duration(milliseconds: 100),
                () => _phoneFocus.requestFocus(),
              );
            },
            icon: const Icon(Icons.edit, color: Color(0xFF00FF00), size: 20),
            label: const Text('Edit', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      const SizedBox(height: 10),
      TextField(
        controller: _otpController,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(6),
        ],
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          letterSpacing: 6,
          fontSize: 18,
        ),
        decoration: const InputDecoration(
          hintText: 'Enter OTP',
          hintStyle: TextStyle(color: Colors.white70, letterSpacing: 1),
          filled: false,
          border: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
          enabledBorder:
              UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.white, width: 2),
          ),
        ),
      ),
      const SizedBox(height: 14),
      if (canResend)
        SizedBox(
          width: 200,
          child: OutlinedButton(
            onPressed: _busy ? null : _sendOtp,
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.orangeRed,
              side: const BorderSide(color: AppColors.orangeRed),
            ),
            child: const Text('RESEND OTP'),
          ),
        )
      else
        Text(
          'Resend OTP in $_timer seconds',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
      const SizedBox(height: 14),
      _primaryButton('VERIFY OTP', _verifyOtp),
      const SizedBox(height: 10),
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Checkbox(
            value: _agreed,
            onChanged: (v) => setState(() => _agreed = v ?? false),
            side: const BorderSide(color: Colors.white),
            fillColor: WidgetStateProperty.resolveWith(
              (states) => states.contains(WidgetState.selected)
                  ? AppColors.orangeRed
                  : Colors.transparent,
            ),
          ),
          Flexible(
            child: GestureDetector(
              onTap: () => Navigator.pushNamed(context, AppRoutes.privacy),
              child: const Text(
                'I agree with Terms & Conditions and Privacy Policy',
                style: TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    ];
  }

  // ── small pieces ───────────────────────────────────────────────────────
  Widget _stepLabel(String number, String text, {bool done = false}) {
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: const BoxDecoration(
            color: AppColors.orangeRed,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            number,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (done) ...[
          const Spacer(),
          const Icon(Icons.check_circle, color: Color(0xFF39D98A), size: 16),
        ],
      ],
    );
  }

  Widget _cityButton(String key, String label) {
    final active = _selectedCity == key;
    return GestureDetector(
      onTap: () => _selectCity(key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: active ? AppColors.orangeRed : Colors.white10,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active ? AppColors.orangeRed : Colors.white54,
            width: active ? 2 : 1.5,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.orangeRed.withValues(alpha: 0.45),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.place, size: 14, color: Colors.white),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _typeButton(
    String key,
    String title,
    String sub,
    IconData icon, {
    bool external = false,
  }) {
    final active = _selectedType == key;
    final enabled = _selectedCity.isNotEmpty;
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: GestureDetector(
        onTap: enabled ? () => _selectType(key) : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
          decoration: BoxDecoration(
            color: active ? AppColors.orangeRed : Colors.white10,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: active ? AppColors.orangeRed : Colors.white54,
              width: active ? 2 : 1.5,
            ),
          ),
          child: Stack(
            children: [
              if (external)
                const Positioned(
                  top: 0,
                  right: 0,
                  child: Icon(Icons.open_in_new, size: 10, color: Colors.white70),
                ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 20, color: Colors.white),
                  const SizedBox(height: 5),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: const TextStyle(color: Colors.white70, fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _countryPicker() {
    return InkWell(
      onTap: _pickCountry,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.white)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_countryFlag, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 5),
            Text(
              _countryCode,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
          ],
        ),
      ),
    );
  }

  Future<void> _pickCountry() async {
    final picked = await showModalBottomSheet<({String code, String flag})>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => ListView.builder(
        itemCount: _countries.length,
        itemBuilder: (_, i) {
          final c = _countries[i];
          return ListTile(
            dense: true,
            leading: Text(c.flag, style: const TextStyle(fontSize: 20)),
            title: Text(c.name, style: const TextStyle(fontSize: 14)),
            trailing: Text(c.code, style: const TextStyle(fontSize: 13)),
            onTap: () => Navigator.pop(ctx, (code: c.code, flag: c.flag)),
          );
        },
      ),
    );
    if (picked != null) {
      setState(() {
        _countryCode = picked.code;
        _countryFlag = picked.flag;
      });
    }
  }

  Widget _primaryButton(String label, VoidCallback onTap) {
    return SizedBox(
      width: 200,
      height: 44,
      child: FilledButton(
        onPressed: _busy ? null : onTap,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.orangeRed,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
        child: _busy
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
      ),
    );
  }
}

/// The dark translucent panel over the hero image.
class BackdropFilterScrim extends StatelessWidget {
  const BackdropFilterScrim({super.key});

  @override
  Widget build(BuildContext context) =>
      Container(color: const Color(0x80313131));
}

/// The country list from Login.jsx (India first since it's the default).
const List<({String code, String name, String flag})> _countries = [
  (code: '+91', name: 'India', flag: '🇮🇳'),
  (code: '+1', name: 'United States', flag: '🇺🇸'),
  (code: '+44', name: 'United Kingdom', flag: '🇬🇧'),
  (code: '+61', name: 'Australia', flag: '🇦🇺'),
  (code: '+65', name: 'Singapore', flag: '🇸🇬'),
  (code: '+971', name: 'United Arab Emirates', flag: '🇦🇪'),
  (code: '+966', name: 'Saudi Arabia', flag: '🇸🇦'),
  (code: '+60', name: 'Malaysia', flag: '🇲🇾'),
  (code: '+94', name: 'Sri Lanka', flag: '🇱🇰'),
  (code: '+880', name: 'Bangladesh', flag: '🇧🇩'),
  (code: '+977', name: 'Nepal', flag: '🇳🇵'),
  (code: '+92', name: 'Pakistan', flag: '🇵🇰'),
  (code: '+86', name: 'China', flag: '🇨🇳'),
  (code: '+81', name: 'Japan', flag: '🇯🇵'),
  (code: '+82', name: 'South Korea', flag: '🇰🇷'),
  (code: '+49', name: 'Germany', flag: '🇩🇪'),
  (code: '+33', name: 'France', flag: '🇫🇷'),
  (code: '+39', name: 'Italy', flag: '🇮🇹'),
  (code: '+34', name: 'Spain', flag: '🇪🇸'),
  (code: '+31', name: 'Netherlands', flag: '🇳🇱'),
  (code: '+41', name: 'Switzerland', flag: '🇨🇭'),
  (code: '+46', name: 'Sweden', flag: '🇸🇪'),
  (code: '+47', name: 'Norway', flag: '🇳🇴'),
  (code: '+45', name: 'Denmark', flag: '🇩🇰'),
  (code: '+7', name: 'Russia', flag: '🇷🇺'),
  (code: '+27', name: 'South Africa', flag: '🇿🇦'),
  (code: '+234', name: 'Nigeria', flag: '🇳🇬'),
  (code: '+254', name: 'Kenya', flag: '🇰🇪'),
  (code: '+20', name: 'Egypt', flag: '🇪🇬'),
  (code: '+90', name: 'Turkey', flag: '🇹🇷'),
  (code: '+972', name: 'Israel', flag: '🇮🇱'),
  (code: '+974', name: 'Qatar', flag: '🇶🇦'),
  (code: '+973', name: 'Bahrain', flag: '🇧🇭'),
  (code: '+968', name: 'Oman', flag: '🇴🇲'),
  (code: '+62', name: 'Indonesia', flag: '🇮🇩'),
  (code: '+63', name: 'Philippines', flag: '🇵🇭'),
  (code: '+66', name: 'Thailand', flag: '🇹🇭'),
  (code: '+84', name: 'Vietnam', flag: '🇻🇳'),
  (code: '+64', name: 'New Zealand', flag: '🇳🇿'),
  (code: '+55', name: 'Brazil', flag: '🇧🇷'),
  (code: '+52', name: 'Mexico', flag: '🇲🇽'),
  (code: '+54', name: 'Argentina', flag: '🇦🇷'),
  (code: '+56', name: 'Chile', flag: '🇨🇱'),
  (code: '+57', name: 'Colombia', flag: '🇨🇴'),
];
