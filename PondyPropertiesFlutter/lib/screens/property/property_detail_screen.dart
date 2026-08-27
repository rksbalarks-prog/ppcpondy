import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/formatters.dart';
import '../../core/session.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../models/property.dart';
import '../../routes.dart';
import '../../services/account_service.dart';
import '../../services/auth_service.dart';
import '../../services/property_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';
import '../../widgets/points_dialogs.dart';

/// DetailProperty.jsx / Details.jsx — the full listing page: photo gallery,
/// spec sheet, contact reveal, action cards and the report/help dialogs.
class PropertyDetailScreen extends StatefulWidget {
  const PropertyDetailScreen({
    super.key,
    required this.ppcId,
    this.siblings = const [],
  });

  final String ppcId;

  /// PPC-IDs of the list the user was browsing, in order — the Flutter stand-in
  /// for the web's `navigate('/detail/x', { state: { properties } })`. Swiping
  /// left walks this list; without it there is nowhere to go next.
  final List<String> siblings;

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final _pageController = PageController();

  /// Backs the inline "Make an offer" field the web renders under the price.
  final _offerController = TextEditingController();

  Property? _property;
  List<AdImage> _ads = const [];
  bool _loading = true;
  String? _error;
  int _photoIndex = 0;

  // Walkthrough videos. The web reads `propertyDetails.video` first and only
  // falls back to /get-property-video/<ppcId> when the document has none.
  List<String> _videos = const [];
  VideoPlayerController? _videoController;
  bool _videoStarting = false;

  // Contact reveal — gated by the points balance, not the retired daily quota.
  bool _contactVisible = false;
  String? _contactNumber;

  // One-shot action flags (persisted like the web's localStorage keys).
  bool _interestSent = false;
  bool _soldOutReported = false;
  bool _propertyReported = false;
  bool _helpRequested = false;
  bool _photoRequested = false;
  bool _addressRequested = false;
  bool _favorite = false;
  bool _callRated = false;

  @override
  void initState() {
    super.initState();
    _restoreFlags();
    _load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _offerController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  void _restoreFlags() {
    _interestSent = Session.flag('interestSent', widget.ppcId);
    _soldOutReported = Session.flag('soldOutReported', widget.ppcId);
    _propertyReported = Session.flag('propertyReported', widget.ppcId);
    _helpRequested = Session.flag('helpRequested', widget.ppcId);
    _photoRequested = Session.flag('photoRequested', widget.ppcId);
    _addressRequested = Session.flag('addressRequested', widget.ppcId);
    _favorite = Session.flag('isHeartClicked', widget.ppcId);
    _callRated = Session.flag('callRated', widget.ppcId);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final property = await PropertyService.fetchByPpcId(widget.ppcId);
      if (!mounted) return;
      if (property == null) {
        setState(() {
          _error = 'This property is no longer available.';
          _loading = false;
        });
        return;
      }
      setState(() {
        _property = property;
        _loading = false;
        // Trust the server's favourite list over the cached flag.
        _favorite = property.isFavoritedBy(
              context.read<SessionProvider>().phoneNumber,
            ) ||
            _favorite;
      });

      final session = context.read<SessionProvider>();
      AuthService.recordView(session.phoneNumber, 'Property Detail');
      if (session.isLoggedIn) {
        unawaited(PropertyService.saveView(
          phoneNumber: session.phoneNumber!,
          ppcId: widget.ppcId,
        ));
      }
      unawaited(_loadAds());
      unawaited(_loadVideos(property));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  Future<void> _loadAds() async {
    final ads = await PropertyService.fetchDetailAds();
    if (mounted) setState(() => _ads = ads);
  }

  /// Same precedence the web uses: whatever is embedded on the document wins,
  /// and the dedicated endpoint is only consulted when there is nothing there.
  Future<void> _loadVideos(Property property) async {
    var urls = property.videoUrls;
    if (urls.isEmpty) {
      urls = await PropertyService.fetchPropertyVideos(widget.ppcId);
    }
    if (mounted && urls.isNotEmpty) setState(() => _videos = urls);
  }

  Future<void> _playVideo() async {
    if (_videos.isEmpty || _videoStarting) return;
    setState(() => _videoStarting = true);
    final controller = VideoPlayerController.networkUrl(Uri.parse(_videos.first));
    try {
      await controller.initialize();
      await controller.play();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _videoController = controller;
        _videoStarting = false;
      });
    } catch (_) {
      await controller.dispose();
      if (!mounted) return;
      setState(() => _videoStarting = false);
      showToast(context, 'Could not play this video.', error: true);
    }
  }

  String? get _phone => context.read<SessionProvider>().phoneNumber;

  bool _requireLogin() {
    if (_phone != null && _phone!.isNotEmpty) return true;
    showToast(context, 'Please log in to continue.', error: true);
    return false;
  }

  // ───────────────────────── actions ─────────────────────────

  /// Details.jsx `handleOwnerContactClick`.
  ///
  /// The old `/contact-owner` daily-quota endpoint is dead on the web ("LEGACY
  /// DAILY-VIEW LIMIT — DISABLED"); the reveal is gated by the points balance
  /// instead. The number itself comes off the already-loaded property, so a
  /// reveal costs exactly one deduct call and no lookup.
  Future<void> _revealContact() async {
    if (!_requireLogin()) return;

    // Already showing? Clicking again just hides it — never a second charge.
    if (_contactVisible) {
      setState(() => _contactVisible = false);
      return;
    }

    // Re-view of a contact this user already paid for: confirm before spending.
    if (Session.flag('points-revealed', widget.ppcId)) {
      final again = await showRevealAgainDialog(context);
      if (!again || !mounted) return;
    }

    if (!await _spendPointsForReveal()) return;
    await _revealAndNotify();
  }

  /// `performPointsReveal` — balance check, then deduct. Returns false when the
  /// caller must abort (insufficient balance, or the deduct failed).
  Future<bool> _spendPointsForReveal() async {
    final session = context.read<SessionProvider>();
    try {
      final balance = await AccountService.pointsBalance(_phone!);
      if (!mounted) return false;

      if (balance < kPointsPerContactView) {
        await showInsufficientPointsDialog(context, balance: balance);
        return false;
      }

      final result = await AccountService.pointsDeduct(
        phoneNumber: _phone!,
        points: kPointsPerContactView,
        rentId: widget.ppcId,
        reason: 'view-owner-contact',
      );
      if (!mounted) return false;

      // The route reports "not enough points" as a 200 + success:false.
      if (!result.success) {
        await showInsufficientPointsDialog(context, balance: result.balance);
        return false;
      }

      await Session.setFlag('points-revealed', widget.ppcId, true);
      // The web fires a `points:updated` event so the navbar pill re-reads the
      // balance; here the provider owns that number, so refresh it directly.
      unawaited(session.refreshPoints());
      return true;
    } catch (e) {
      if (mounted) {
        showToast(
          context,
          'Could not verify your points balance. Please try again.',
          error: true,
        );
      }
      return false;
    }
  }

  /// `revealAndNotify` — show the contact, then tell both sides over WhatsApp.
  Future<void> _revealAndNotify() async {
    if (!mounted) return;
    setState(() {
      _contactVisible = true;
      _contactNumber = _property?.displayContact;
    });

    // Best-effort, exactly as on the web: a failed notification must not undo
    // a reveal the user has already been charged for. Note the owner is pinged
    // on their REAL number even when the buyer only ever sees the masked
    // assigned one.
    final p = _property;
    if (p == null) return;

    final ownerPhone = p.phoneNumber;
    if (ownerPhone != null) {
      unawaited(AuthService.sendWhatsApp(ownerPhone, '''
Hello Owner 👋

Someone has viewed your contact details on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${p.ppcId}
👤 User Name: User
📞 User Phone: $_phone

Greeting: They are interested in connecting with you about your property.

Best regards,
Pondy property Team'''));
    }

    unawaited(AuthService.sendWhatsApp(_phone!, '''
Hello User 👋

You have successfully viewed the owner's contact details on Rent Pondy App!

📋 Property Details:
🆔 Rent ID: ${p.ppcId}
👨‍💼 Owner Name: ${p.ownerName ?? 'Owner'}
📞 Owner Phone: $ownerPhone

Greeting: You can now reach out directly to the owner to discuss the property.

Best regards,
Rent Pondy Team'''));
  }

  Future<void> _sendInterest() async {
    if (!_requireLogin()) return;
    if (_interestSent) {
      showToast(context, 'Your interest is already sent.');
      return;
    }
    final ok = await confirmDialog(
      context,
      message: 'Are you sure you want to send interest?',
    );
    if (!ok) return;
    await _runAction(
      () => PropertyService.sendInterest(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
      ),
      onStatus: (status) {
        if (status == 'sendInterest') {
          _setFlag('interestSent', true, () => _interestSent = true);
          return 'Interest sent successfully!';
        }
        _setFlag('interestSent', true, () => _interestSent = true);
        return 'Interest already recorded for this property.';
      },
    );
  }

  Future<void> _reportSoldOut() async {
    if (!_requireLogin()) return;
    if (_soldOutReported) {
      showToast(context, 'Sold out report already submitted.');
      return;
    }
    final ok = await confirmDialog(
      context,
      message: 'Are you sure you want to report this property as sold out?',
    );
    if (!ok) return;
    await _runAction(
      () => PropertyService.reportSoldOut(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
      ),
      onStatus: (status) {
        if (status == 'soldOut') {
          _setFlag('soldOutReported', true, () => _soldOutReported = true);
          return 'Property reported as sold out.';
        }
        return 'This property is already reported as sold out.';
      },
    );
  }

  Future<void> _reportProperty() async {
    if (!_requireLogin()) return;
    if (_propertyReported) {
      showToast(context, 'This property is already reported.');
      return;
    }
    final result = await _reasonDialog(
      title: 'Report Property',
      reasons: const [
        'Already Sold',
        'Wrong Information',
        'Not Responding',
        'Fraud',
        'Duplicate Ads',
        'Other',
      ],
    );
    if (result == null) return;
    await _runAction(
      () => PropertyService.reportProperty(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        reason: result.reason,
        comment: result.comment,
      ),
      onStatus: (status) {
        if (status == 'reportProperties') {
          _setFlag('propertyReported', true, () => _propertyReported = true);
          return 'Property reported. Thank you for the feedback.';
        }
        return 'This property has already been reported.';
      },
    );
  }

  Future<void> _needHelp() async {
    if (!_requireLogin()) return;
    if (_helpRequested) {
      showToast(context, 'Help request already submitted.');
      return;
    }
    final result = await _reasonDialog(
      title: 'Need Help',
      reasons: const [
        'Help Me to Buy this Property',
        'Book for Property Visit',
        'Loan Help',
        'Property Valuation',
        'Document Verification',
        'Property Surveying',
        'EC',
        'Patta Name Change',
        'Registration Help',
        'Others',
      ],
    );
    if (result == null) return;
    await _runAction(
      () => PropertyService.needHelp(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        reason: result.reason,
        comment: result.comment,
      ),
      onStatus: (status) {
        if (status == 'needHelp') {
          _setFlag('helpRequested', true, () => _helpRequested = true);
          return 'Help request sent. Our team will contact you.';
        }
        return 'You have already requested help for this property.';
      },
    );
  }

  Future<void> _toggleFavorite() async {
    if (!_requireLogin()) return;
    final wasFavorite = _favorite;
    setState(() => _favorite = !wasFavorite); // optimistic, like the web heart
    try {
      final status = await PropertyService.toggleFavorite(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        currentlyFavorite: wasFavorite,
      );
      final isFav = status == 'favorite';
      _setFlag('isHeartClicked', isFav, () => _favorite = isFav);
      if (mounted) {
        showToast(
          context,
          isFav ? 'Added to your shortlist.' : 'Removed from your shortlist.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _favorite = wasFavorite);
      showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _requestPhotos() async {
    if (!_requireLogin() || _photoRequested) return;
    try {
      await PropertyService.requestPhotos(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
      );
      _setFlag('photoRequested', true, () => _photoRequested = true);
      if (mounted) showToast(context, 'Photo request sent to the owner.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _requestAddress() async {
    if (!_requireLogin() || _addressRequested) return;
    try {
      await PropertyService.requestAddress(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
      );
      _setFlag('addressRequested', true, () => _addressRequested = true);
      if (mounted) showToast(context, 'Address request sent to the owner.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  /// Dial, then ask how the call went — the web's `called-experience` popup.
  /// The prompt is fire-and-forget: dismissing it costs the user nothing.
  Future<void> _callOwner() async {
    // Recorded before dialling, and never allowed to block the call.
    if (_phone != null && _contactNumber != null) {
      unawaited(PropertyService.logContactSend(
        userPhone: _phone!,
        postedUserPhone: _contactNumber!,
        ppcId: widget.ppcId,
      ));
    }
    await dialPhone(context, _contactNumber);
    if (!mounted || _callRated) return;
    final result = await _reasonDialog(
      title: 'How was the call?',
      reasons: const [
        'Already Sold',
        'Wrong Information',
        'Not Responding',
        'Fraud',
        'Duplicate Ads',
        'Other',
      ],
    );
    if (result == null) return;
    try {
      await PropertyService.logCallExperience(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        reason: result.reason,
        comment: result.comment.isEmpty ? null : result.comment,
      );
      _setFlag('callRated', true, () => _callRated = true);
      if (mounted) showToast(context, 'Thanks — your feedback was recorded.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  /// Submit handler for the inline offer form. The web validates that a price
  /// and a stored phone number exist, then shows a confirm modal before
  /// posting — same order here.
  Future<void> _submitOffer() async {
    if (!_requireLogin()) return;

    final amount = num.tryParse(_offerController.text.trim());
    if (amount == null || amount <= 0) {
      showToast(context, 'Enter an offer amount first.', error: true);
      return;
    }

    final confirmed = await confirmDialog(
      context,
      message: 'Send an offer of ${Fmt.price(amount)} to the owner?',
    );
    if (!confirmed || !mounted) return;

    try {
      await PropertyService.makeOffer(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        amount: amount,
      );
      if (!mounted) return;
      _offerController.clear();
      FocusScope.of(context).unfocus();
      showToast(context, 'Offer of ${Fmt.price(amount)} sent.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  Future<void> _runAction(
    Future<String> Function() call, {
    required String Function(String status) onStatus,
  }) async {
    try {
      final status = await call();
      final message = onStatus(status);
      if (mounted) {
        setState(() {});
        showToast(context, message);
      }
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    }
  }

  void _setFlag(String name, bool value, VoidCallback apply) {
    Session.setFlag(name, widget.ppcId, value);
    apply();
  }

  Future<({String reason, String comment})?> _reasonDialog({
    required String title,
    required List<String> reasons,
  }) async {
    String? selected;
    final commentController = TextEditingController();

    // Details.jsx's `Popup`: a rounded-5 card with an uppercase grey title, a
    // filter-icon Select, a one-row "Add Comment" textarea, and a CANCEL /
    // SUBMIT pair split 50-50 — SUBMIT on the web's #4b3aa8 indigo.
    final result = await showDialog<({String reason, String comment})>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          insetPadding: const EdgeInsets.symmetric(horizontal: 24),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    title.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // The bg-light, border-0, centred Form.Select.
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F9FA),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.filter_alt_outlined,
                            size: 19, color: AppColors.textFaint),
                        Expanded(
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: selected,
                              isExpanded: true,
                              hint: const Center(
                                child: Text(
                                  'Select Reason',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ),
                              items: reasons
                                  .map((r) => DropdownMenuItem(
                                        value: r,
                                        child: Center(
                                          child: Text(
                                            r,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textMuted,
                                            ),
                                          ),
                                        ),
                                      ))
                                  .toList(),
                              onChanged: (v) => setLocal(() => selected = v),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: commentController,
                    maxLines: 2,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textMuted,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Add Comment',
                      contentPadding: const EdgeInsets.all(14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFF8F9FA),
                            foregroundColor: AppColors.text,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6)),
                          ),
                          child: const Text('CANCEL',
                              style: TextStyle(fontWeight: FontWeight.w500)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: FilledButton(
                          onPressed: selected == null
                              ? null
                              : () => Navigator.pop(
                                    ctx,
                                    (
                                      reason: selected!,
                                      comment: commentController.text.trim()
                                    ),
                                  ),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF4B3AA8),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6)),
                          ),
                          child: const Text('SUBMIT',
                              style: TextStyle(fontWeight: FontWeight.w500)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    commentController.dispose();
    return result;
  }

  // ───────────────────────── build ─────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      // The web's sticky strip: a flat #EFEFEF band with a teal back arrow and
      // a 15px "PROPERTY DETAILS" label. Share and favourite live down in the
      // title row, exactly as Details.jsx places them.
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
          'PROPERTY DETAILS',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppColors.text,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Copy PPC-ID',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: widget.ppcId));
              showToast(context, 'PPC-ID copied');
            },
            icon: const Icon(Icons.copy, size: 18, color: AppColors.teal),
          ),
        ],
      ),
      // Horizontal flick anywhere on the page: right goes back, left steps to
      // the next PPC-ID (DetailProperty.jsx handleTouchStart/handleTouchEnd,
      // 50px threshold). Drags that begin on the gallery win the arena first,
      // so paging through photos still works.
      body: GestureDetector(
        onHorizontalDragEnd: _onHorizontalFlick,
        child: _body(),
      ),
    );
  }

  static const double _swipeThreshold = 50;

  /// Details.jsx `handleTouchEnd`: swipe right goes back, swipe left advances
  /// to the next property **in the list the user came from**.
  ///
  /// This used to do `ppcId + 1`, which is not the same thing — IDs are not
  /// contiguous, so incrementing lands on an unrelated listing or a 404. The
  /// web walks `properties` by index, and so does this.
  void _onHorizontalFlick(DragEndDetails details) {
    final dx = details.primaryVelocity ?? 0;
    if (dx > _swipeThreshold) {
      Navigator.maybePop(context);
      return;
    }
    if (dx >= -_swipeThreshold) return;

    final index = widget.siblings.indexOf(widget.ppcId);
    if (index < 0 || index >= widget.siblings.length - 1) return; // at the end

    Navigator.pushReplacementNamed(
      context,
      AppRoutes.propertyDetail,
      arguments: {
        'ppcId': widget.siblings[index + 1],
        'siblings': widget.siblings,
      },
    );
  }

  Widget _body() {
    if (_loading) return const AppLoader(label: 'Loading property…');
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);

    final p = _property!;
    // Section order follows Details.jsx top to bottom: gallery, PPC_ID pill,
    // title row, price, offer form, the spec grid, contact, map, then the
    // four action cards. The web keeps everything in one flat column rather
    // than the stack of white cards this screen used to render.
    return ListView(
      padding: const EdgeInsets.only(bottom: 30),
      children: [
        _gallery(p),
        _summary(p),
        if (_videos.isNotEmpty) _videoSection(p),
        _specSheet(p),
        _contactSection(p),
        _locationSection(p),
        _actionGrid(),
        if (_ads.isNotEmpty) _adsStrip(),
      ],
    );
  }

  /// The Swiper block from Details.jsx: a 200px rounded frame with a soft drop
  /// shadow, the teal ❮ ❯ buttons pinned bottom-right, and the frosted
  /// "3 / 12" counter centred beneath. When a listing has no photos the web
  /// swaps in a placeholder carrying the Photo Request button.
  Widget _gallery(Property p) {
    final photos = p.photoUrls;
    final total = photos.length + _videos.length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A000000), // 0 4px 8px rgba(0,0,0,.1)
                blurRadius: 8,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (photos.isEmpty)
                Stack(
                  fit: StackFit.expand,
                  children: [
                    const AppNetworkImage(url: null),
                    Positioned(
                      right: 10,
                      bottom: 40,
                      child: GestureDetector(
                        onTap: _photoRequested ? null : _requestPhotos,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          color: _photoRequested
                              ? const Color(0xFF3F61D8)
                              : const Color(0xFF34ACD6),
                          child: Text(
                            _photoRequested
                                ? 'Photo Request Sent'
                                : 'Photo Request',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              else
                PageView.builder(
                  controller: _pageController,
                  onPageChanged: (i) => setState(() => _photoIndex = i),
                  itemCount: photos.length,
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => _openLightbox(photos, i),
                    child: AppNetworkImage(url: photos[i], fit: BoxFit.cover),
                  ),
                ),

              if (p.isFeatured)
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                          colors: AppColors.featuredGradient),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star, size: 13, color: Colors.black),
                        SizedBox(width: 4),
                        Text(
                          'Featured',
                          style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),

              // ❮ ❯ — 60×30 solid #019988 blocks, radius 4, bottom right.
              if (photos.length > 1)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _galleryArrow('❮', () => _stepPhoto(-1, photos.length)),
                      const SizedBox(width: 4),
                      _galleryArrow('❯', () => _stepPhoto(1, photos.length)),
                    ],
                  ),
                ),

              // Frosted counter pill, centred 14px off the bottom.
              if (total > 0)
                Positioned(
                  bottom: 14,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(10, 5, 12, 5),
                          decoration: BoxDecoration(
                            color: const Color(0x8C0F171C),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: const Color(0x2EFFFFFF)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.photo_camera_outlined,
                                  size: 13, color: Colors.white),
                              const SizedBox(width: 7),
                              Text.rich(
                                TextSpan(children: [
                                  TextSpan(
                                    text: '${_photoIndex + 1}',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                  const TextSpan(
                                    text: ' / ',
                                    style: TextStyle(color: Colors.white54),
                                  ),
                                  TextSpan(
                                    text: '$total',
                                    style: const TextStyle(color: Colors.white70),
                                  ),
                                ]),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.4,
                                  height: 1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _galleryArrow(String glyph, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 60,
        height: 30,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.galleryNav,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          glyph,
          style: const TextStyle(
            fontSize: 18,
            color: Colors.white,
            height: 1,
          ),
        ),
      ),
    );
  }

  /// The Swiper loops, so stepping past either end wraps around.
  void _stepPhoto(int delta, int count) {
    if (count == 0) return;
    final next = (_photoIndex + delta + count) % count;
    _pageController.animateToPage(
      next,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  /// The web's image modal: a white card over a 50%-black backdrop, with the
  /// 38px circular ‹ › arrows overlaid on the photo and a footer carrying
  /// "Image 3 of 12" beside a Close button. Tapping the backdrop dismisses it.
  void _openLightbox(List<String> photos, int index) {
    var current = index;
    final controller = PageController(initialPage: index);

    showDialog<void>(
      context: context,
      barrierColor: Colors.black54,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => Dialog(
          backgroundColor: Colors.white,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.sizeOf(ctx).height * 0.6,
                      ),
                      child: PageView.builder(
                        controller: controller,
                        onPageChanged: (i) => setLocal(() => current = i),
                        itemCount: photos.length,
                        itemBuilder: (_, i) => InteractiveViewer(
                          child: Center(
                            child: AppNetworkImage(
                                url: photos[i], fit: BoxFit.contain),
                          ),
                        ),
                      ),
                    ),
                    if (photos.length > 1) ...[
                      Positioned(
                        left: 10,
                        child: _lightboxArrow('‹', () {
                          final next =
                              (current - 1 + photos.length) % photos.length;
                          controller.jumpToPage(next);
                        }),
                      ),
                      Positioned(
                        right: 10,
                        child: _lightboxArrow('›', () {
                          controller.jumpToPage((current + 1) % photos.length);
                        }),
                      ),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Image ${current + 1} of ${photos.length}',
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.textFaint),
                      ),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF6C757D), // btn-secondary
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ).then((_) => controller.dispose());
  }

  Widget _lightboxArrow(String glyph, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: Color(0x8C000000), // rgba(0,0,0,.55)
          shape: BoxShape.circle,
        ),
        child: Text(
          glyph,
          style: const TextStyle(
              fontSize: 22, color: Colors.white, height: 1),
        ),
      ),
    );
  }

  /// Property walkthrough video — the web's `videos` Swiper slide, headed by
  /// `<h4 className="text-start mt-3">Selected Videos:</h4>` and framed at
  /// 200px with the same radius-8 + drop shadow the photo carousel uses.
  Widget _videoSection(Property p) {
    final ready = _videoController?.value.isInitialized ?? false;

    return Container(
      margin: const EdgeInsets.fromLTRB(10, 12, 10, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'Selected Videos:',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: AspectRatio(
              aspectRatio: ready ? _videoController!.value.aspectRatio : 16 / 9,
              child: ready
                  ? Stack(
                      alignment: Alignment.bottomCenter,
                      children: [
                        GestureDetector(
                          onTap: () => setState(() {
                            _videoController!.value.isPlaying
                                ? _videoController!.pause()
                                : _videoController!.play();
                          }),
                          child: VideoPlayer(_videoController!),
                        ),
                        VideoProgressIndicator(
                          _videoController!,
                          allowScrubbing: true,
                          colors: const VideoProgressColors(
                            playedColor: AppColors.tealDark,
                          ),
                        ),
                      ],
                    )
                  : Stack(
                      fit: StackFit.expand,
                      children: [
                        AppNetworkImage(url: p.coverPhotoUrl),
                        Container(color: Colors.black38),
                        Center(
                          child: _videoStarting
                              ? const CircularProgressIndicator(color: Colors.white)
                              : IconButton(
                                  iconSize: 56,
                                  onPressed: _playVideo,
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
        ],
      ),
    );
  }

  /// Everything between the gallery and the spec grid on the web page: the
  /// PPC_ID pill, the "Mode | Type" line with its share + heart controls, the
  /// orange price and its negotiable badge, the price in words, and the inline
  /// "Make an offer" form.
  Widget _summary(Property p) {
    final negotiable = (p.negotiation ?? '').toLowerCase() == 'yes';

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 12, 10, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PPC_ID : 1234 — gradient pill, all caps, tight.
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: AppColors.brandGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(999),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x402F747F),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Text.rich(
              TextSpan(children: [
                const TextSpan(
                  text: 'PPC_ID',
                  style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w500),
                ),
                const TextSpan(text: ' : ', style: TextStyle(color: Colors.white60)),
                TextSpan(
                  text: p.ppcId,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ]),
              style: const TextStyle(
                fontSize: 11.5,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Mode | Type, with share and the outlined heart on the right.
          Row(
            children: [
              Expanded(
                child: Text(
                  '${Fmt.cap(p.propertyMode)} |  ${Fmt.cap(p.propertyType)}',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                    color: AppColors.ink,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Share',
                onPressed: _share,
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.share, size: 20, color: AppColors.teal),
              ),
              IconButton(
                tooltip: _favorite ? 'Remove from favourites' : 'Add to favourites',
                onPressed: _toggleFavorite,
                visualDensity: VisualDensity.compact,
                icon: Icon(
                  _favorite ? Icons.favorite : Icons.favorite_border,
                  size: 26,
                  color: _favorite ? Colors.red : AppColors.teal,
                ),
              ),
            ],
          ),

          // ₹ 45,00,000  [NEGOTIABLE]
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  p.priceLabel,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                    color: p.isOnDemand ? AppColors.onDemand : AppColors.priceOrange,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: negotiable ? AppColors.negOkBg : AppColors.negNoBg,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  negotiable ? 'NEGOTIABLE' : 'NON-NEGOTIABLE',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: negotiable ? AppColors.negOkFg : AppColors.negNoFg,
                  ),
                ),
              ),
            ],
          ),
          if (_priceInWords(p) != null) ...[
            const SizedBox(height: 4),
            Text(
              _priceInWords(p)!,
              style: const TextStyle(
                fontSize: 12.5,
                fontStyle: FontStyle.italic,
                color: AppColors.priceWords,
              ),
            ),
          ],

          const SpecHeading('Make an offer', padding: EdgeInsets.only(top: 12, bottom: 8)),
          _offerForm(),
        ],
      ),
    );
  }

  /// The web's offer `<form>`: a rupee-prefixed field and a gradient Submit,
  /// side by side. Submitting runs the same confirm-then-post flow the action
  /// card used to trigger.
  Widget _offerForm() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _offerController,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: const TextStyle(fontSize: 14, color: AppColors.ink),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Make an offer',
              hintStyle: const TextStyle(
                fontSize: 14,
                color: AppColors.labelMuted,
                fontWeight: FontWeight.w400,
              ),
              prefixIcon: const Icon(Icons.currency_rupee,
                  size: 16, color: AppColors.teal),
              prefixIconConstraints:
                  const BoxConstraints(minWidth: 34, minHeight: 0),
              filled: true,
              fillColor: AppColors.tileBg,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.fieldBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.fieldBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.teal, width: 1.5),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: _submitOffer,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: AppColors.brandGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(10),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x402F747F),
                  blurRadius: 10,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: const Text(
              'Submit',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// "1.5 Crores" / "45 Lakhs" — the web's `priceInWords`, which trims a
  /// trailing ".00" so round figures don't read as "2.00 Crores".
  String? _priceInWords(Property p) {
    final value = p.price;
    if (value is! num || value <= 0) return null;
    String trim(String s) => s.endsWith('.00') ? s.substring(0, s.length - 3) : s;
    if (value >= 10000000) {
      return '${trim((value / 10000000).toStringAsFixed(2))} Crores';
    }
    if (value >= 100000) {
      return '${trim((value / 100000).toStringAsFixed(2))} Lakhs';
    }
    return null;
  }


  /// The `cards` row from Details.jsx — four 100×80 shadowed white tiles laid
  /// out `col-3`, each a 30px glyph over a 10px caption. The web tints a card
  /// #F7F2F4 on hover; the pressed/《done》state stands in for that on touch.
  ///
  /// Offer and photo requests are NOT cards here: the web puts the offer form
  /// inline under the price and the photo request on the empty gallery, and
  /// both now live in those places.
  Widget _actionGrid() {
    final actions = <({IconData icon, String label, bool done, VoidCallback tap})>[
      (
        icon: Icons.thumb_up_alt_outlined,
        label: _interestSent ? 'Interest Sent' : 'Send Your Interest',
        done: _interestSent,
        tap: _sendInterest,
      ),
      (
        icon: Icons.sell_outlined,
        label: _soldOutReported ? 'Sold Out Reported' : 'Report Sold Out',
        done: _soldOutReported,
        tap: _reportSoldOut,
      ),
      (
        icon: Icons.flag_outlined,
        label: _propertyReported ? 'Property Reported' : 'Report Property',
        done: _propertyReported,
        tap: _reportProperty,
      ),
      (
        icon: Icons.support_agent,
        label: _helpRequested ? 'Help Requested' : 'Need Help',
        done: _helpRequested,
        tap: _needHelp,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 16, 10, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final a in actions)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: Material(
                  color: a.done ? const Color(0xFFF7F2F4) : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  elevation: 2,
                  shadowColor: const Color(0x33000000),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(6),
                    onTap: a.tap,
                    child: SizedBox(
                      height: 80,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(a.icon, size: 30, color: AppColors.teal),
                          const SizedBox(height: 6),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: Text(
                              a.label,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 10,
                                height: 1.15,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// "Contact Info" and the reveal button, then — once revealed — the owner
  /// grid and the Property Location rows the web keeps hidden behind the same
  /// gate, followed by the Request Address / Call pair.
  Widget _contactSection(Property p) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 6, 10, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SpecHeading('Contact Info',
              padding: EdgeInsets.only(top: 14, bottom: 8)),

          // Outlined while hidden, solid teal once viewed — the web toggles
          // this button's fill on `Viewed`.
          GestureDetector(
            onTap: _revealContact,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _contactVisible ? AppColors.teal : Colors.transparent,
                border: Border.all(color: AppColors.teal),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.contact_phone_outlined,
                    size: 20,
                    color: _contactVisible ? Colors.white : AppColors.teal,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'View owner contact details',
                    style: TextStyle(
                      fontSize: 14,
                      color: _contactVisible ? Colors.white : AppColors.teal,
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_contactVisible) ...[
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final half = (constraints.maxWidth - 12) / 2;
                return Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    SizedBox(
                      width: half,
                      child: _contactRow(Icons.person, 'Name', p.ownerName),
                    ),
                    SizedBox(
                      width: half,
                      child: _contactRow(Icons.access_time, 'Best Time to Call',
                          p.bestTimeToCall),
                    ),
                    SizedBox(
                      width: constraints.maxWidth,
                      child: _contactRow(Icons.email_outlined, 'Email', p.email),
                    ),
                    SizedBox(
                      width: half,
                      child: _contactRow(Icons.phone, 'Mobile', _contactNumber,
                          onTap: _callOwner),
                    ),
                    SizedBox(
                      width: half,
                      child: _contactRow(Icons.phone_forwarded, 'Alternate Phone',
                          p.alternatePhone,
                          onTap: p.alternatePhone == null
                              ? null
                              : () => dialPhone(context, p.alternatePhone)),
                    ),
                  ],
                );
              },
            ),
            // Property Location is gated behind the same reveal on the web.
            _locationRows(p),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (p.coordinates == null) ...[
                  OutlinedButton(
                    onPressed: _addressRequested ? null : _requestAddress,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.teal,
                      side: const BorderSide(color: AppColors.teal),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6)),
                    ),
                    child: Text(
                      _addressRequested ? 'Address Requested' : 'Request Address',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                IconButton(
                  tooltip: 'WhatsApp',
                  onPressed: () => openWhatsApp(
                    context,
                    _contactNumber,
                    'Hi, I am interested in your property PPC-ID ${widget.ppcId} listed on Pondy Property.',
                  ),
                  icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                ),
                if (_contactNumber != null)
                  FilledButton.icon(
                    onPressed: _callOwner,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6)),
                    ),
                    icon: const Icon(Icons.phone, size: 15),
                    label: const Text('Call', style: TextStyle(fontSize: 13)),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// One entry of the revealed owner grid: a teal glyph, a 13px grey caption
  /// and the value under it. Tappable values (the two phone numbers) take the
  /// teal the web gives them.
  Widget _contactRow(IconData icon, String label, String? value,
      {VoidCallback? onTap}) {
    final shown = (value ?? '').trim().isEmpty ? 'N/A' : value!.trim();
    final live = onTap != null && shown != 'N/A';
    return GestureDetector(
      onTap: live ? onTap : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(icon, size: 16, color: AppColors.teal),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 13, color: AppColors.textFaint),
                ),
                Text(
                  shown,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: live ? AppColors.teal : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Plots and land have no rooms, so the web drops the whole "Property
  /// Features" block — and "Furnished" with it — for these types.
  static const List<String> _featurelessTypes = [
    'plot',
    'land',
    'agricultural land',
  ];

  bool get _hidesFeatures =>
      _featurelessTypes.contains((_property?.propertyType ?? '').toLowerCase().trim());

  Widget _specSheet(Property p) {
    final sections = <String, List<({String label, String? value, IconData icon})>>{
      'Basic Property Info': [
        (label: 'Property Mode', value: p.propertyMode, icon: Icons.home_work),
        (label: 'Property Type', value: p.propertyType, icon: Icons.house_siding),
        (label: 'Length', value: p.length?.toString(), icon: Icons.swap_horiz),
        (label: 'Breadth', value: p.breadth?.toString(), icon: Icons.height),
        (
          label: 'Total Area',
          value: p.totalArea == null ? null : '${p.totalArea} ${p.areaUnit ?? ''}',
          icon: Icons.square_foot
        ),
        (label: 'Ownership', value: p.ownership, icon: Icons.person),
        (label: 'Property Approved', value: p.propertyApproved, icon: Icons.verified),
        (label: 'Property Age', value: p.propertyAge, icon: Icons.timer_outlined),
        (label: 'Bank Loan', value: p.bankLoan, icon: Icons.account_balance),
        (label: 'No. of Views', value: '${p.views}', icon: Icons.visibility),
      ],
      if (!_hidesFeatures) 'Property Features': [
        (label: 'Bedrooms', value: p.bedrooms, icon: Icons.bed),
        (label: 'Floor No', value: p.floorNo, icon: Icons.stairs),
        (label: 'Kitchen', value: p.kitchen, icon: Icons.kitchen),
        (label: 'Kitchen Type', value: p.kitchenType, icon: Icons.countertops),
        (label: 'Balconies', value: p.balconies, icon: Icons.balcony),
        (label: 'Floors', value: p.numberOfFloors, icon: Icons.layers),
        (label: 'Western', value: p.western, icon: Icons.bathtub),
        (label: 'Attached Bathrooms', value: p.attachedBathrooms, icon: Icons.shower),
        (label: 'Car Park', value: p.carParking, icon: Icons.directions_car),
        (label: 'Lift', value: p.lift, icon: Icons.elevator),
      ],
      'Other Details': [
        if (!_hidesFeatures)
          (label: 'Furnished', value: p.furnished, icon: Icons.chair),
        (label: 'Facing', value: p.facing, icon: Icons.explore),
        (label: 'Sale Mode', value: p.salesMode, icon: Icons.trending_up),
        (label: 'Sales Type', value: p.salesType, icon: Icons.bar_chart),
        (label: 'Posted By', value: p.postedBy, icon: Icons.account_circle),
        (label: 'Posted On', value: Fmt.date(p.createdAt), icon: Icons.event),
      ],
    };

    // The web renders every row in the list, showing an italic "N/A" where a
    // value is missing rather than dropping the row — so the two columns stay
    // aligned and the sheet reads the same for every listing.
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 4, 10, 0),
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Two equal columns with a 12px gutter — the web's col-6 pairs.
          final tileWidth = (constraints.maxWidth - 12) / 2;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final entry in sections.entries) ...[
                SpecHeading(entry.key),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: entry.value
                      .map((r) => SizedBox(
                            width: tileWidth,
                            child: SpecTile(
                              label: r.label,
                              value: Fmt.cap(r.value),
                              icon: r.icon,
                            ),
                          ))
                      .toList(),
                ),
              ],
              const SpecHeading('Description'),
              SpecTile(
                label: 'Description',
                value: p.description ?? '',
                icon: Icons.description_outlined,
                fullWidth: true,
              ),
            ],
          );
        },
      ),
    );
  }

  /// The location BLOCK on the web is only the map: an `<h6>Property Location
  /// on Map:</h6>` beside a "Share Property Location" link and its orange share
  /// glyph, then a 300px radius-8 canvas. Details.jsx renders the whole thing
  /// only when `locationCoordinates` exists, and keeps the Country/State/City
  /// rows inside the owner-contact reveal instead — see [_locationRows].
  Widget _locationSection(Property p) {
    final coords = p.coordinates;
    if (coords == null) return const SizedBox.shrink();

    final link = 'https://www.google.com/maps?q=${coords.lat},${coords.lng}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 14, 10, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Property Location on Map:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => _shareMenu(
                  url: link,
                  text: 'Check out this property: $link',
                ),
                child: const Row(
                  children: [
                    Text(
                      'Share Property Location',
                      style: TextStyle(fontSize: 13, color: Color(0xFF014378)),
                    ),
                    SizedBox(width: 6),
                    Icon(Icons.ios_share, size: 18, color: Color(0xFFFF4920)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // No Google Maps SDK in the app, so the 300px canvas becomes a
          // tappable panel that hands off to the installed maps app.
          GestureDetector(
            onTap: () => openMap(context, coords.lat, coords.lng),
            child: Container(
              height: 300,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.tileBg,
                border: Border.all(color: AppColors.tileBorder),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map_outlined, size: 44, color: AppColors.teal),
                  SizedBox(height: 10),
                  Text(
                    'Open in Maps',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.teal,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Country / State / City / … — revealed together with the owner contact,
  /// which is where `locationDetailsList` sits on the web.
  Widget _locationRows(Property p) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tileWidth = (constraints.maxWidth - 12) / 2;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SpecHeading('Property Location'),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: <({String label, String? value, IconData icon})>[
                (label: 'Country', value: p.country, icon: Icons.public),
                (label: 'State', value: p.state, icon: Icons.map_outlined),
                (label: 'City', value: p.city, icon: Icons.location_city),
                (label: 'District', value: p.district, icon: Icons.place_outlined),
                (label: 'Nagar', value: p.nagar, icon: Icons.signpost_outlined),
                (label: 'Area', value: p.area, icon: Icons.location_on_outlined),
                (label: 'Street Name', value: p.streetName, icon: Icons.streetview),
                (
                  label: 'Door Number',
                  value: p.doorNumber,
                  icon: Icons.door_front_door_outlined
                ),
                (label: 'Pin Code', value: p.pinCode, icon: Icons.markunread_mailbox),
              ]
                  .map((r) => SizedBox(
                        width: tileWidth,
                        child: SpecTile(
                          label: r.label,
                          value: Fmt.cap(r.value),
                          icon: r.icon,
                        ),
                      ))
                  .toList(),
            ),
          ],
        );
      },
    );
  }

  Widget _adsStrip() {
    return SizedBox(
      height: 160,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
        itemCount: _ads.length,
        itemBuilder: (_, i) => Padding(
          padding: const EdgeInsets.only(right: 10),
          child: GestureDetector(
            onTap: _ads[i].link == null
                ? null
                : () => launchExternal(context, _ads[i].link!),
            child: AppNetworkImage(
              url: _ads[i].imageUrl,
              width: 280,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }

  /// Public link to this listing on the React site.
  String get _listingUrl => '${AppConfig.siteUrl}/details/${widget.ppcId}';

  String get _shareText {
    final p = _property;
    if (p == null) {
      return 'Check out this property on Pondy Property: PPC-ID ${widget.ppcId}';
    }
    return '${Fmt.cap(p.propertyType)} for ${Fmt.cap(p.propertyMode)} in '
        '${p.locationLine} — ${p.priceLabel}\nPPC-ID: ${p.ppcId}\n$_listingUrl';
  }

  Future<void> _share() => _shareMenu(url: _listingUrl, text: _shareText);

  /// The web's share popover: Facebook / X / LinkedIn / WhatsApp deep links,
  /// plus the platform sheet which the web has no equivalent of.
  Future<void> _shareMenu({required String url, required String text}) async {
    final encodedUrl = Uri.encodeComponent(url);
    final targets = <({String label, IconData icon, Color color, String link})>[
      (
        label: 'WhatsApp',
        icon: Icons.chat,
        color: const Color(0xFF25D366),
        link: 'https://wa.me/?text=${Uri.encodeComponent(text)}',
      ),
      (
        label: 'Facebook',
        icon: Icons.facebook,
        color: const Color(0xFF1877F2),
        link: 'https://www.facebook.com/sharer/sharer.php?u=$encodedUrl',
      ),
      (
        label: 'X (Twitter)',
        icon: Icons.alternate_email,
        color: Colors.black87,
        link: 'https://twitter.com/intent/tweet?url=$encodedUrl'
            '&text=${Uri.encodeComponent('View this:')}',
      ),
      (
        label: 'LinkedIn',
        icon: Icons.business_center,
        color: const Color(0xFF0A66C2),
        link: 'https://www.linkedin.com/sharing/share-offsite/?url=$encodedUrl',
      ),
    ];

    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final t in targets)
              ListTile(
                dense: true,
                leading: Icon(t.icon, color: t.color),
                title: Text(t.label, style: const TextStyle(fontSize: 14)),
                onTap: () {
                  Navigator.pop(sheetContext);
                  launchExternal(context, t.link);
                },
              ),
            const Divider(height: 1),
            ListTile(
              dense: true,
              leading: const Icon(Icons.copy, color: AppColors.textMuted),
              title: const Text('Copy link', style: TextStyle(fontSize: 14)),
              onTap: () {
                Navigator.pop(sheetContext);
                Clipboard.setData(ClipboardData(text: url));
                showToast(context, 'Link copied');
              },
            ),
            ListTile(
              dense: true,
              leading: const Icon(Icons.ios_share, color: AppColors.textMuted),
              title: const Text('More…', style: TextStyle(fontSize: 14)),
              onTap: () {
                Navigator.pop(sheetContext);
                Share.share(text, subject: 'Pondy Property PPC-${widget.ppcId}');
              },
            ),
          ],
        ),
      ),
    );
  }
}
