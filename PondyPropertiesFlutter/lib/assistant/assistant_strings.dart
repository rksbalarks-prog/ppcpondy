/// Bilingual UI strings for the AI assistant — a direct port of the `T` map in
/// the web `AssistantWidget.jsx`. Keyed by 'en' | 'ta'.
class AssistantT {
  final String title;
  final String placeholder;
  final String hi;
  final String micHint;
  final String listen;
  final String tapPlay;
  final String details;
  final String confirm;
  final String addBuyer;
  final String addProperty;
  final String buyPoints;
  final String sent;
  final String spend;
  final String voiceListen;
  final String voiceThink;
  final String voiceSpeak;
  final String callStart;
  final String callEnd;
  final String pressToChat;
  final String callHint;
  final String voicePrompt;
  final String micBlocked;
  final String micNoDevice;
  final String loginFirst;

  const AssistantT({
    required this.title,
    required this.placeholder,
    required this.hi,
    required this.micHint,
    required this.listen,
    required this.tapPlay,
    required this.details,
    required this.confirm,
    required this.addBuyer,
    required this.addProperty,
    required this.buyPoints,
    required this.sent,
    required this.spend,
    required this.voiceListen,
    required this.voiceThink,
    required this.voiceSpeak,
    required this.callStart,
    required this.callEnd,
    required this.pressToChat,
    required this.callHint,
    required this.voicePrompt,
    required this.micBlocked,
    required this.micNoDevice,
    required this.loginFirst,
  });

  /// The `cta` key on a navigate action → its localized button label.
  String cta(String key) {
    switch (key) {
      case 'addBuyer':
        return addBuyer;
      case 'addProperty':
        return addProperty;
      case 'buyPoints':
        return buyPoints;
      default:
        return key;
    }
  }

  static const AssistantT en = AssistantT(
    title: 'Pondy Properties AI Assistant',
    placeholder: 'Ask about properties for sale…',
    hi: "👋 Welcome! I'm your Pondy Properties assistant. I can help you find properties for sale, check your points and more.",
    micHint: 'To talk to me, just tap the microphone button.',
    listen: 'Listening… tap to stop',
    tapPlay: '🔊 Tap to play reply',
    details: 'Details',
    confirm: 'Confirm',
    addBuyer: '➕ Add Buyer Assistance',
    addProperty: '🏠 Add Property',
    buyPoints: '💎 Buy Points',
    sent: 'Done ✓',
    spend: 'Spends points',
    voiceListen: '🎙️ Listening…',
    voiceThink: '💭 Thinking…',
    voiceSpeak: '🔊 Speaking…',
    callStart: 'Hands-free voice',
    callEnd: 'End voice',
    pressToChat: 'AI Assistant',
    callHint: 'Tap to talk with me',
    voicePrompt: 'How can I help you?',
    micBlocked:
        '🎤 I need microphone access to talk. Please allow the Microphone permission, then tap 🎤 again.',
    micNoDevice: '🎤 No microphone was found on this device.',
    loginFirst: 'Please log in first to use the assistant.',
  );

  static const AssistantT ta = AssistantT(
    title: 'பாண்டி ப்ராப்பர்டீஸ் உதவியாளர்',
    placeholder: 'Property பற்றி கேளுங்கள்…',
    hi: '👋 வணக்கம்! நான் உங்க Pondy Properties assistant. Property தேட, points பார்க்க எல்லாம் help பண்ணுவேன்.',
    micHint: 'என்னோட பேச, மைக் பட்டனை அழுத்துங்க.',
    listen: 'கேட்கிறேன்… நிறுத்த தட்டவும்',
    tapPlay: '🔊 பதிலைக் கேட்க தட்டவும்',
    details: 'விவரம்',
    confirm: 'உறுதி',
    addBuyer: '➕ Buyer Assistance சேர்க்க',
    addProperty: '🏠 Property போடு',
    buyPoints: '💎 Points வாங்க',
    sent: 'முடிந்தது ✓',
    spend: 'புள்ளிகள் செலவாகும்',
    voiceListen: '🎙️ கேட்கிறேன்…',
    voiceThink: '💭 யோசிக்கிறேன்…',
    voiceSpeak: '🔊 பேசுறேன்…',
    callStart: 'குரல் மோட்',
    callEnd: 'நிறுத்து',
    pressToChat: 'AI உதவியாளர்',
    callHint: 'பேச தட்டவும்',
    voicePrompt: 'சொல்லுங்க, நான் எப்படி உதவட்டும்?',
    micBlocked:
        '🎤 பேச மைக் அனுமதி தேவை. Microphone-ஐ allow பண்ணிட்டு, மறுபடியும் 🎤 தட்டுங்க.',
    micNoDevice: '🎤 இந்த device-ல மைக் இல்லை.',
    loginFirst: 'Assistant-ஐ பயன்படுத்த முதலில் login பண்ணுங்க.',
  );

  static AssistantT of(String lang) => lang == 'ta' ? ta : en;
}

/// Tamil-script detection — mirrors `const TAMIL = /[஀-௿]/` in the web.
final _tamilRe = RegExp(r'[஀-௿]');
String detectLang(String? text) => _tamilRe.hasMatch(text ?? '') ? 'ta' : 'en';

/// Indian price formatting for sale listings (Cr / L / grouped rupees) — the
/// Dart twin of `formatPrice()` in the web widget.
String formatPrice(Object? value) {
  if (value == null) return '';
  final num? n = value is num ? value : num.tryParse(value.toString());
  if (n == null) return value.toString(); // e.g. "On Demand"
  String trim(double v) =>
      v.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '');
  if (n >= 10000000) return '₹${trim(n / 10000000)} Cr';
  if (n >= 100000) return '₹${trim(n / 100000)} L';
  return '₹${n.toStringAsFixed(0)}';
}
