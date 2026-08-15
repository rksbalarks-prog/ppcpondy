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

  Future<void> _makeOffer() async {
    if (!_requireLogin()) return;
    final controller = TextEditingController();
    final amount = await showDialog<num>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Make an Offer', style: TextStyle(fontSize: 16)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          autofocus: true,
          decoration: const InputDecoration(
            prefixText: '₹ ',
            hintText: 'Your offer amount',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final value = num.tryParse(controller.text.trim());
              Navigator.pop(ctx, value);
            },
            child: const Text('Send Offer'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (amount == null || amount <= 0) return;
    try {
      await PropertyService.makeOffer(
        phoneNumber: _phone!,
        ppcId: widget.ppcId,
        amount: amount,
      );
      if (mounted) showToast(context, 'Offer of ${Fmt.price(amount)} sent.');
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
    final result = await showDialog<({String reason, String comment})>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...reasons.map(
                  (r) => RadioListTile<String>(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    value: r,
                    // ignore: deprecated_member_use
                    groupValue: selected,
                    activeColor: AppColors.teal,
                    title: Text(r, style: const TextStyle(fontSize: 13)),
                    // ignore: deprecated_member_use
                    onChanged: (v) => setLocal(() => selected = v),
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: commentController,
                  maxLines: 2,
                  decoration: const InputDecoration(hintText: 'Add a comment'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: selected == null
                  ? null
                  : () => Navigator.pop(
                        ctx,
                        (reason: selected!, comment: commentController.text.trim()),
                      ),
              child: const Text('Submit'),
            ),
          ],
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
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(
          'PPC-ID: ${widget.ppcId}',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            tooltip: 'Copy PPC-ID',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: widget.ppcId));
              showToast(context, 'PPC-ID copied');
            },
            icon: const Icon(Icons.copy, size: 20),
          ),
          IconButton(
            tooltip: 'Share',
            onPressed: _share,
            icon: const Icon(Icons.share, size: 20),
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
    return ListView(
      padding: const EdgeInsets.only(bottom: 30),
      children: [
        _gallery(p),
        _summary(p),
        if (_videos.isNotEmpty) _videoSection(p),
        _actionGrid(),
        _contactSection(p),
        _specSheet(p),
        _locationSection(p),
        if (_ads.isNotEmpty) _adsStrip(),
      ],
    );
  }

  Widget _gallery(Property p) {
    final photos = p.photoUrls;
    return Stack(
      children: [
        SizedBox(
          height: 250,
          child: photos.isEmpty
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    const AppNetworkImage(url: null),
                    Center(
                      child: FilledButton.icon(
                        onPressed: _photoRequested ? null : _requestPhotos,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.tealDark,
                        ),
                        icon: const Icon(Icons.photo_camera, size: 18),
                        label: Text(
                          _photoRequested ? 'Photo Requested' : 'Request Photos',
                        ),
                      ),
                    ),
                  ],
                )
              : PageView.builder(
                  controller: _pageController,
                  onPageChanged: (i) => setState(() => _photoIndex = i),
                  itemCount: photos.length,
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => _openLightbox(photos, i),
                    child: AppNetworkImage(url: photos[i], fit: BoxFit.cover),
                  ),
                ),
        ),
        if (photos.length > 1)
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                photos.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _photoIndex ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _photoIndex ? Colors.white : Colors.white54,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ),
        Positioned(
          top: 10,
          right: 12,
          child: Material(
            color: Colors.white,
            shape: const CircleBorder(),
            child: IconButton(
              onPressed: _toggleFavorite,
              icon: Icon(
                _favorite ? Icons.favorite : Icons.favorite_border,
                color: _favorite ? Colors.red : AppColors.textMuted,
              ),
            ),
          ),
        ),
        if (p.isFeatured)
          Positioned(
            top: 10,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: AppColors.featuredGradient),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, size: 13, color: Colors.black),
                  SizedBox(width: 4),
                  Text(
                    'Featured',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  void _openLightbox(List<String> photos, int index) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (ctx) => Stack(
        children: [
          PageView.builder(
            controller: PageController(initialPage: index),
            itemCount: photos.length,
            itemBuilder: (_, i) => InteractiveViewer(
              child: Center(child: AppNetworkImage(url: photos[i], fit: BoxFit.contain)),
            ),
          ),
          Positioned(
            top: 40,
            right: 16,
            child: IconButton(
              onPressed: () => Navigator.pop(ctx),
              icon: const Icon(Icons.close, color: Colors.white, size: 28),
            ),
          ),
        ],
      ),
    );
  }

  /// Property walkthrough video — the web's `videos` Swiper slide.
  Widget _videoSection(Property p) {
    final ready = _videoController?.value.isInitialized ?? false;

    return AppCard(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(12, 12, 12, 8),
            child: Row(
              children: [
                Icon(Icons.videocam, size: 18, color: AppColors.teal),
                SizedBox(width: 6),
                Text(
                  'Property Video',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.teal,
                  ),
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(14)),
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

  Widget _summary(Property p) {
    return AppCard(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  Fmt.cap(p.propertyType),
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.searchBottom,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  Fmt.cap(p.propertyMode),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tealDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.place, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  p.locationLine,
                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                p.priceLabel,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: p.isOnDemand ? AppColors.onDemand : AppColors.tealDark,
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  p.negotiation == 'Yes' ? 'Negotiable' : 'Non-Negotiable',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          if (_priceInWords(p) != null) ...[
            const SizedBox(height: 2),
            Text(
              _priceInWords(p)!,
              style: const TextStyle(fontSize: 12, color: AppColors.textFaint),
            ),
          ],
          const Divider(height: 22),
          Row(
            children: [
              _quickFact(Icons.square_foot,
                  '${p.totalArea ?? '—'} ${p.areaUnit ?? ''}'.trim(), 'Total Area'),
              _quickFact(Icons.bed, p.bedrooms ?? '—', 'Bedrooms'),
              _quickFact(Icons.visibility, '${p.views}', 'Views'),
              _quickFact(Icons.calendar_today, Fmt.date(p.displayDate), 'Posted'),
            ],
          ),
        ],
      ),
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

  Widget _quickFact(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppColors.teal),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textFaint)),
        ],
      ),
    );
  }

  /// The four action cards on the web detail page, plus the offer/photo/address
  /// actions that live further down that page.
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
      (
        icon: Icons.local_offer_outlined,
        label: 'Make an Offer',
        done: false,
        tap: _makeOffer,
      ),
      (
        icon: Icons.photo_camera_outlined,
        label: _photoRequested ? 'Photos Requested' : 'Request Photos',
        done: _photoRequested,
        tap: _requestPhotos,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.95,
        children: actions
            .map(
              (a) => Material(
                color: a.done ? AppColors.searchBottom : Colors.white,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: a.tap,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: a.done ? AppColors.tealSoft : const Color(0xFFE6E6E6),
                      ),
                    ),
                    padding: const EdgeInsets.all(6),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(a.icon, size: 24, color: AppColors.teal),
                        const SizedBox(height: 8),
                        Text(
                          a.label,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _contactSection(Property p) {
    return AppCard(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Contact Info',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.teal,
            ),
          ),
          const SizedBox(height: 10),
          if (!_contactVisible)
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _revealContact,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.tealDark,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                icon: const Icon(Icons.phone, size: 18),
                label: const Text('View Owner Contact'),
              ),
            )
          else ...[
            Row(
              children: [
                const Icon(Icons.person, size: 18, color: AppColors.teal),
                const SizedBox(width: 8),
                Text(
                  p.ownerName ?? 'Owner',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _callOwner,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.tealDark,
                    ),
                    icon: const Icon(Icons.call, size: 17),
                    label: Text(
                      _contactNumber ?? '—',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  tooltip: 'WhatsApp',
                  onPressed: () => openWhatsApp(
                    context,
                    _contactNumber,
                    'Hi, I am interested in your property PPC-ID ${widget.ppcId} listed on Pondy Property.',
                  ),
                  icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                ),
              ],
            ),
            if (p.bestTimeToCall != null) ...[
              const SizedBox(height: 6),
              Text(
                'Best time to call: ${p.bestTimeToCall}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ],
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

    return AppCard(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Two equal columns with a 12px gutter — the web's col-6 pairs.
          final tileWidth = (constraints.maxWidth - 12) / 2;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final entry in sections.entries)
                if (entry.value.any((r) => (r.value ?? '').isNotEmpty)) ...[
                  _sectionHeading(entry.key),
                  Wrap(
                    spacing: 12,
                    runSpacing: 4,
                    children: entry.value
                        .where((r) =>
                            (r.value ?? '').isNotEmpty && r.value != 'N/A')
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
              if ((p.description ?? '').isNotEmpty) ...[
                _sectionHeading('Description'),
                SpecTile(
                  label: 'Description',
                  value: p.description!,
                  icon: Icons.description_outlined,
                  fullWidth: true,
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  /// Black 16px section title — the web uses `<h4>` here, not the teal used
  /// for card titles elsewhere on the page.
  Widget _sectionHeading(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.black,
        ),
      ),
    );
  }

  Widget _locationSection(Property p) {
    final coords = p.coordinates;
    return AppCard(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeading('Property Location'),
          SpecTile(
            label: 'Address',
            value: p.fullAddress,
            icon: Icons.place,
            fullWidth: true,
          ),
          // The web lists every location component as its own grid tile.
          LayoutBuilder(
            builder: (context, constraints) {
              final tileWidth = (constraints.maxWidth - 12) / 2;
              return Wrap(
                spacing: 12,
                runSpacing: 4,
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
                    .where((r) => (r.value ?? '').isNotEmpty && r.value != 'N/A')
                    .map((r) => SizedBox(
                          width: tileWidth,
                          child: SpecTile(
                            label: r.label,
                            value: Fmt.cap(r.value),
                            icon: r.icon,
                          ),
                        ))
                    .toList(),
              );
            },
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _addressRequested ? null : _requestAddress,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.tealDark,
                    side: const BorderSide(color: AppColors.tealSoft),
                  ),
                  icon: const Icon(Icons.location_searching, size: 16),
                  label: Text(
                    _addressRequested ? 'Address Requested' : 'Request Address',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
              if (coords != null) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => openMap(context, coords.lat, coords.lng),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.tealDark,
                    ),
                    icon: const Icon(Icons.map, size: 16),
                    label: const Text('View on Map', style: TextStyle(fontSize: 12)),
                  ),
                ),
                IconButton(
                  tooltip: 'Share location',
                  onPressed: () {
                    final link =
                        'https://www.google.com/maps?q=${coords.lat},${coords.lng}';
                    _shareMenu(
                      url: link,
                      text: 'Check out this property: $link',
                    );
                  },
                  icon: const Icon(Icons.share, size: 18, color: AppColors.tealDark),
                ),
              ],
            ],
          ),
        ],
      ),
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
