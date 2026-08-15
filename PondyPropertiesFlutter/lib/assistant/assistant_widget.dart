import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../routes.dart';
import '../state/session_provider.dart';
import 'assistant_controller.dart';
import 'assistant_fab_slot.dart';
import 'assistant_models.dart';
import 'assistant_orb.dart';
import 'assistant_strings.dart';
import 'assistant_voice.dart';

// Assistant palette — AppColors.teal, matching the rest of the app.
const _teal = Color(0xFF30747F);
const _tealLight = Color(0xFF3E8E99);
const _panelBg = Color(0xFFF7F8FA);
const _userBubble = Color(0xFF4F4B7E); // AppColors.indigo

/// Floating AI assistant — chat + hands-free voice, result cards, and Confirm
/// chips for write actions. A faithful port of the web `AssistantWidget.jsx`,
/// mounted app-wide over every screen via `MaterialApp.builder`.
class AssistantWidget extends StatefulWidget {
  const AssistantWidget({super.key});

  @override
  State<AssistantWidget> createState() => _AssistantWidgetState();
}

class _AssistantWidgetState extends State<AssistantWidget> {
  // Auto-open the assistant once per app launch when logged in.
  static bool _autoOpened = false;

  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _voice = AssistantVoice();

  late AssistantController _ctrl;
  bool _depsReady = false;

  bool _open = false;
  // Default to Tamil (Tanglish) like the web widget — most users are Tamil
  // speakers, and the EN/த toggle in the header still switches.
  String _lang = 'ta';
  bool _speakerOn = true;
  Uint8List? _blockedBytes;
  bool _welcomeSpoken = false;
  int _lastMsgCount = 0;

  // Hands-free voice mode.
  bool _voiceMode = false;
  bool _voiceModeRef = false;
  String _voiceStatus = ''; // '', listening, thinking, speaking

  // Admin-set welcome greeting (from /status), keyed by lang.
  Map<String, String>? _greeting;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_depsReady) return;
    _depsReady = true;
    _ctrl = context.read<AssistantController>();

    // Pick up an admin-set greeting (best-effort).
    _ctrl.fetchStatus().then((st) {
      final g = st?['greeting'];
      if (g is Map && mounted) {
        setState(() => _greeting = {
              'en': '${g['en'] ?? ''}',
              'ta': '${g['ta'] ?? ''}',
            });
      }
    });

    // Auto-open once, after first frame, when logged in.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _autoOpened) return;
      if (context.read<SessionProvider>().isLoggedIn) {
        _autoOpened = true;
        setState(() => _open = true);
        _speakWelcome();
      }
    });
  }

  @override
  void dispose() {
    _voiceModeRef = false;
    _voice.dispose();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  AssistantT get _t => AssistantT.of(_lang);

  String get _hi {
    final g = _greeting?[_lang];
    if (g != null && g.trim().isNotEmpty) return g.trim();
    return _t.hi;
  }

  // ── open / close ────────────────────────────────────────────────────────
  void _openPanel() {
    setState(() => _open = true);
    _speakWelcome();
  }

  void _closePanel() {
    _stopVoiceMode();
    setState(() => _open = false);
  }

  Future<void> _speakWelcome() async {
    if (_welcomeSpoken || !_speakerOn) return;
    if (_ctrl.messages.isNotEmpty) {
      _welcomeSpoken = true;
      return;
    }
    _welcomeSpoken = true;
    final welcome = '$_hi ${_t.micHint}';
    final bytes = await _ctrl.speak(welcome, detectLang(welcome));
    if (bytes == null || !mounted) return;
    final played = await _voice.playBytes(bytes);
    if (!played && mounted) setState(() => _blockedBytes = bytes);
  }

  // ── text send ──────────────────────────────────────────────────────────
  Future<void> _submitText(String text) async {
    final msg = text.trim();
    if (msg.isEmpty) return;
    _inputCtrl.clear();
    setState(() => _blockedBytes = null);
    final useLang = (_lang == 'ta' || detectLang(msg) == 'ta') ? 'ta' : 'en';
    final reply = await _ctrl.send(msg, lang: useLang);
    await _maybeSpeak(reply);
  }

  Future<void> _maybeSpeak(String? text) async {
    if (!_speakerOn || text == null || text.isEmpty) return;
    final bytes = await _ctrl.speak(text, detectLang(text));
    if (bytes == null || !mounted) return;
    final played = await _voice.playBytes(bytes);
    if (!played && mounted) setState(() => _blockedBytes = bytes);
  }

  Future<void> _playBlocked() async {
    final b = _blockedBytes;
    if (b == null) return;
    await _voice.playBytes(b);
    if (mounted) setState(() => _blockedBytes = null);
  }

  // ── hands-free voice ─────────────────────────────────────────────────────
  Future<void> _startVoiceMode() async {
    if (!_voice.supported || _voiceModeRef || !_open) return;
    setState(() => _blockedBytes = null);
    final perm = await _voice.ensureMic();
    if (!perm.ok) {
      if (_open) _ctrl.say(perm.error == 'error' ? _t.micNoDevice : _t.micBlocked);
      return;
    }
    if (_voiceModeRef || !_open) return;
    _voiceModeRef = true;
    setState(() => _voiceMode = true);
    _runVoiceLoop();
  }

  void _stopVoiceMode() {
    _voiceModeRef = false;
    _voice.cancelListening();
    if (mounted) {
      setState(() {
        _voiceMode = false;
        _voiceStatus = '';
      });
    }
  }

  Future<void> _runVoiceLoop() async {
    // Greet first on a fresh session.
    if (_ctrl.messages.isEmpty && _voiceModeRef && _open) {
      _ctrl.say(_t.voicePrompt);
      if (_speakerOn) {
        if (mounted) setState(() => _voiceStatus = 'speaking');
        final g = await _ctrl.speak(_t.voicePrompt, _lang);
        if (g != null && _voiceModeRef && _open) await _voice.playBytesAwait(g);
      }
    }
    while (_voiceModeRef && _open) {
      if (mounted) setState(() => _voiceStatus = 'listening');
      VoiceClip? clip;
      try {
        clip = await _voice.recordUntilSilence();
      } catch (_) {
        _stopVoiceMode();
        return;
      }
      if (!_voiceModeRef || !_open) break;
      if (clip == null || clip.sizeBytes < 1500) continue; // silence

      if (mounted) setState(() => _voiceStatus = 'thinking');
      final text = await _ctrl.transcribe(clip);
      if (!_voiceModeRef || !_open) break;
      if (text.isEmpty) continue;

      final useLang = (_lang == 'ta' || detectLang(text) == 'ta') ? 'ta' : 'en';
      final reply = await _ctrl.send(text, lang: useLang);
      if (!_voiceModeRef || !_open) break;

      if (reply != null && reply.isNotEmpty && _speakerOn) {
        if (mounted) setState(() => _voiceStatus = 'speaking');
        final blob = await _ctrl.speak(reply, useLang);
        if (blob != null && _voiceModeRef && _open) {
          await _voice.playBytesAwait(blob);
        }
      }
    }
    if (mounted) setState(() => _voiceStatus = '');
  }

  // ── navigation from cards / nav actions ───────────────────────────────────
  void _openDetail(ResultCard card) {
    final ppcId = card.ppcId;
    if (ppcId == null) return;
    _stopVoiceMode();
    setState(() => _open = false);
    AssistantNav.nav?.pushNamed(AppRoutes.propertyDetail, arguments: '$ppcId');
  }

  /// Map a backend navigate proposal onto a Flutter route.
  ///
  /// The proposals carry the WEB app's paths (the user app's routes take the
  /// phone as a path segment, e.g. `/buyer-assistance/9876543210`), so match on
  /// the leading segment rather than the whole string.
  void _openNavAction(AssistantAction a) {
    if (!a.isNavigate) return;
    _stopVoiceMode();
    setState(() => _open = false);
    final route = a.navigate!;
    final String target;
    if (route.startsWith('/buyer-assistance')) {
      target = AppRoutes.buyerAssistanceForm;
    } else if (route.startsWith('/add-property') || route.startsWith('/add-form')) {
      target = AppRoutes.addProperty;
    } else if (route.startsWith('/points-plans')) {
      target = AppRoutes.pointsPlans;
    } else {
      target = route;
    }
    // onGenerateRoute returns null for anything unknown, which would throw —
    // fall back to doing nothing rather than crashing the app.
    try {
      AssistantNav.nav?.pushNamed(target);
    } catch (_) {/* unknown route: the button is a no-op */}
  }

  void _autoScroll() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionProvider>();
    if (!session.isLoggedIn) return const SizedBox.shrink();

    final ctrl = context.watch<AssistantController>();
    if (ctrl.messages.length != _lastMsgCount) {
      _lastMsgCount = ctrl.messages.length;
      _autoScroll();
    }

    if (!_open) {
      // Lift clear of any FAB the screen below publishes (see AssistantFabSlot).
      return ValueListenableBuilder<double>(
        valueListenable: AssistantFabSlot.extraBottom,
        builder: (context, extra, _) => Stack(
          children: [
            Positioned(
              right: 16,
              bottom: AssistantFabSlot.defaultBottom + extra,
              child: _fab(),
            ),
          ],
        ),
      );
    }

    final media = MediaQuery.of(context);
    final panelHeight = media.size.height * 0.82;
    return Material(
      type: MaterialType.transparency,
      child: Stack(
        children: [
          Positioned.fill(
            child: GestureDetector(
              onTap: _closePanel,
              child: Container(color: Colors.black.withValues(alpha: 0.35)),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 470),
                child: _panel(ctrl, panelHeight, media.padding.bottom),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── FAB ───────────────────────────────────────────────────────────────────
  Widget _fab() {
    return Material(
      color: _teal,
      shape: const CircleBorder(),
      elevation: 6,
      shadowColor: _teal.withValues(alpha: 0.5),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: _openPanel,
        child: const SizedBox(
          width: 58,
          height: 58,
          child: Icon(Icons.auto_awesome, color: Colors.white, size: 28),
        ),
      ),
    );
  }

  // ── Panel ───────────────────────────────────────────────────────────────
  Widget _panel(AssistantController ctrl, double height, double safeBottom) {
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: _panelBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _header(ctrl),
          Expanded(child: _body(ctrl)),
          if (_voiceMode) _voiceBar(),
          _inputRow(ctrl, safeBottom),
        ],
      ),
    );
  }

  Widget _header(AssistantController ctrl) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [_teal, _tealLight]),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              _t.title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          _headBtn(
            label: _lang == 'en' ? 'EN' : 'த',
            active: _lang == 'ta',
            onTap: () => setState(() => _lang = _lang == 'en' ? 'ta' : 'en'),
          ),
          _headBtn(
            icon: _speakerOn ? Icons.volume_up : Icons.volume_off,
            active: _speakerOn,
            onTap: () => setState(() => _speakerOn = !_speakerOn),
          ),
          _headBtn(
            icon: Icons.refresh,
            onTap: () {
              _stopVoiceMode();
              ctrl.reset();
              _welcomeSpoken = true; // don't re-greet aloud on manual reset
            },
          ),
          _headBtn(icon: Icons.close, onTap: _closePanel),
        ],
      ),
    );
  }

  Widget _headBtn({
    String? label,
    IconData? icon,
    bool active = false,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Material(
        color: active ? Colors.white24 : Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onTap,
          child: SizedBox(
            width: 34,
            height: 30,
            child: Center(
              child: label != null
                  ? Text(label,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13))
                  : Icon(icon, color: Colors.white, size: 18),
            ),
          ),
        ),
      ),
    );
  }

  Widget _body(AssistantController ctrl) {
    final msgs = ctrl.messages;
    return ListView(
      controller: _scrollCtrl,
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
      children: [
        if (msgs.isEmpty) _greetingBlock(),
        if (msgs.isEmpty && _voice.supported && !_voiceMode) _voiceCta(),
        for (final m in msgs) _messageBlock(ctrl, m),
        if (_blockedBytes != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Center(
              child: OutlinedButton(
                onPressed: _playBlocked,
                child: Text(_t.tapPlay),
              ),
            ),
          ),
      ],
    );
  }

  Widget _greetingBlock() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE6E8EC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_hi, style: const TextStyle(fontSize: 14, height: 1.4)),
          const SizedBox(height: 8),
          Text('🎤 ${_t.micHint}',
              style: const TextStyle(
                  fontSize: 12.5, color: _teal, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _voiceCta() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          AssistantOrb(onTap: _startVoiceMode),
          const SizedBox(height: 12),
          Text(_t.pressToChat,
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 2),
          Text(_t.callHint,
              style: const TextStyle(color: Colors.black54, fontSize: 12.5)),
        ],
      ),
    );
  }

  Widget _messageBlock(AssistantController ctrl, ChatMessage m) {
    final isUser = m.role == ChatRole.user;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (m.content.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxWidth: 330),
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
              decoration: BoxDecoration(
                color: isUser ? _userBubble : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: isUser
                    ? null
                    : Border.all(color: const Color(0xFFE6E8EC)),
              ),
              child: Text(
                m.content + (m.streaming ? ' ▍' : ''),
                style: TextStyle(
                  fontSize: 14,
                  height: 1.38,
                  color: isUser ? Colors.white : const Color(0xFF1A1A1A),
                ),
              ),
            ),
          for (final c in m.cards) _resultCard(c),
          for (var i = 0; i < m.actions.length; i++) _actionRow(ctrl, m, i),
        ],
      ),
    );
  }

  Widget _resultCard(ResultCard c) {
    if (c.ppcId == null) return const SizedBox.shrink();
    final price = formatPrice(c.price);
    final meta = <String>[
      if (c.bedrooms != null && c.bedrooms != 'No') '${c.bedrooms} BHK',
      if ((c.furnished ?? '').isNotEmpty) c.furnished!,
      if ((c.totalArea ?? '').isNotEmpty)
        '${c.totalArea} ${c.areaUnit ?? 'sqft'}',
    ].join(' · ');
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _openDetail(c),
        child: Container(
          width: 300,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFDDE7E9)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(c.propertyType ?? 'Property',
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14)),
                  ),
                  Text(price,
                      style: const TextStyle(
                          color: _teal,
                          fontWeight: FontWeight.w800,
                          fontSize: 14)),
                ],
              ),
              if ((c.area ?? c.city ?? '').isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(c.area ?? c.city ?? '',
                    style:
                        const TextStyle(fontSize: 12.5, color: Colors.black87)),
              ],
              if (meta.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(meta,
                    style:
                        const TextStyle(fontSize: 12, color: Colors.black54)),
              ],
              const SizedBox(height: 6),
              Text('#${c.ppcId} · ${_t.details} →',
                  style: const TextStyle(
                      fontSize: 12, color: _teal, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionRow(AssistantController ctrl, ChatMessage m, int i) {
    final a = m.actions[i];
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(11),
      width: 320,
      decoration: BoxDecoration(
        color: a.spendsMoney ? const Color(0xFFFFF7E6) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: a.spendsMoney
                ? const Color(0xFFFFD98A)
                : const Color(0xFFE6E8EC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(a.label,
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
          if ((a.summary ?? '').isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(a.summary!,
                style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ],
          if (a.spendsMoney) ...[
            const SizedBox(height: 3),
            Text('⚠ ${_t.spend}',
                style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFFB26A00),
                    fontWeight: FontWeight.w600)),
          ],
          const SizedBox(height: 9),
          Align(
            alignment: Alignment.centerRight,
            child: _actionButton(ctrl, m, i, a),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(
      AssistantController ctrl, ChatMessage m, int i, AssistantAction a) {
    if (a.isNavigate) {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
            backgroundColor: _teal, foregroundColor: Colors.white),
        onPressed: () => _openNavAction(a),
        child: Text(_t.cta(a.cta ?? '')),
      );
    }
    switch (a.state) {
      case ActionState.done:
        return Text(_t.sent,
            style: const TextStyle(
                color: _teal, fontWeight: FontWeight.w700, fontSize: 13));
      case ActionState.error:
        return Text('✕ ${a.error ?? 'failed'}',
            style: const TextStyle(
                color: Color(0xFFD32F2F),
                fontWeight: FontWeight.w600,
                fontSize: 12.5));
      case ActionState.working:
        return const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: _teal),
        );
      case ActionState.pending:
        return ElevatedButton(
          style: ElevatedButton.styleFrom(
              backgroundColor: _teal, foregroundColor: Colors.white),
          onPressed: () => ctrl.confirm(m.id, i),
          child: Text(_t.confirm),
        );
    }
  }

  Widget _voiceBar() {
    final label = _voiceStatus == 'speaking'
        ? _t.voiceSpeak
        : _voiceStatus == 'thinking'
            ? _t.voiceThink
            : _t.voiceListen;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      color: _teal,
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white
                  .withValues(alpha: _voiceStatus == 'listening' ? 1 : 0.5),
            ),
          ),
          const SizedBox(width: 8),
          Text(label,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600)),
          const Spacer(),
          InkWell(
            onTap: _stopVoiceMode,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('${_t.callEnd} ✕',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 12.5)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inputRow(AssistantController ctrl, double safeBottom) {
    return Container(
      padding: EdgeInsets.fromLTRB(10, 8, 10, 8 + safeBottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE6E8EC))),
      ),
      child: Row(
        children: [
          if (_voice.supported)
            Material(
              color:
                  _voiceMode ? const Color(0xFFD32F2F) : const Color(0xFFEAF2F3),
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => _voiceMode ? _stopVoiceMode() : _startVoiceMode(),
                child: SizedBox(
                  width: 42,
                  height: 42,
                  child: Icon(_voiceMode ? Icons.stop : Icons.mic,
                      color: _voiceMode ? Colors.white : _teal, size: 22),
                ),
              ),
            ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _inputCtrl,
              enabled: !ctrl.busy,
              textInputAction: TextInputAction.send,
              onSubmitted: _submitText,
              decoration: InputDecoration(
                hintText: _voice.isRecording ? _t.listen : _t.placeholder,
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                filled: true,
                fillColor: const Color(0xFFF1F3F5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: _teal,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: ctrl.busy ? null : () => _submitText(_inputCtrl.text),
              child: const SizedBox(
                width: 42,
                height: 42,
                child: Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
