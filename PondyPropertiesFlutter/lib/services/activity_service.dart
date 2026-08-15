import '../core/api_client.dart';
import '../models/misc_models.dart';
import 'response_utils.dart';

/// Which side of a transaction a list screen shows.
///
/// The backend's naming is the opposite of what you'd guess, and the React
/// routes follow it, so we keep the same convention:
///   * `…-buyer`  endpoints answer "which BUYERS acted on MY property"
///     (i.e. what the OWNER MENU shows)
///   * `…-owner`  endpoints answer "which OWNERS' properties did I act on"
///     (i.e. what the BUYER MENU shows)
enum ActivitySide { ownerMenu, buyerMenu }

/// One entry in the Owner/Buyer menu: a title, the endpoint that lists it, and
/// the optional soft-delete/undo endpoints its rows support.
class ActivityFeed {
  const ActivityFeed({
    required this.key,
    required this.title,
    required this.path,
    this.queryKey = 'phoneNumber',
    this.pathParam = false,
    this.deletePath,
    this.undoPath,
    this.emptyText,
  });

  final String key;
  final String title;

  /// Endpoint template; `{phone}` is substituted.
  final String path;

  /// Query-string parameter name when [pathParam] is false.
  final String queryKey;

  /// True when the phone number goes in the path instead of the query.
  final bool pathParam;

  /// Soft-delete / undo templates; `{phone}` and `{id}` are substituted.
  final String? deletePath;
  final String? undoPath;

  final String? emptyText;

  String resolve(String template, String phone, {String? id}) => template
      .replaceAll('{phone}', phone)
      .replaceAll('{id}', id ?? '');
}

/// Loads the Owner-menu / Buyer-menu activity lists.
class ActivityService {
  ActivityService._();

  static final _api = ApiClient.instance;

  /// Owner menu — people who acted on the signed-in user's properties.
  static const List<ActivityFeed> ownerFeeds = [
    ActivityFeed(
      key: 'interestedBuyers',
      title: 'Interested Buyers',
      path: '/get-interest-buyers',
      queryKey: 'postedPhoneNumber',
      deletePath: '/interest/delete/{phone}/{id}',
      undoPath: '/interest/undo/{phone}/{id}',
      emptyText: 'No buyer has sent you interest yet.',
    ),
    ActivityFeed(
      key: 'matchedBuyers',
      title: 'Matched Buyers',
      path: '/fetch-matched-datas-buyer-payment',
      emptyText: 'No matching buyers found for your properties yet.',
    ),
    ActivityFeed(
      key: 'offersFromBuyers',
      title: 'Offers From Buyers',
      path: '/offers/buyer/{phone}',
      pathParam: true,
      deletePath: '/offers/delete/{phone}/{id}',
      undoPath: '/offers/undo/{phone}/{id}',
      emptyText: 'No offers received yet.',
    ),
    ActivityFeed(
      key: 'contactedBuyers',
      title: 'Contacted Buyers',
      path: '/get-contact-buyer',
      queryKey: 'postedPhoneNumber',
      emptyText: 'No buyer has viewed your contact details yet.',
    ),
    ActivityFeed(
      key: 'photoRequestedBuyers',
      title: 'Photo Requested Buyers',
      path: '/photo-requests/buyer/{phone}',
      pathParam: true,
      deletePath: '/photo-requests/delete/{phone}/{id}',
      undoPath: '/photo-requests/undo/{phone}/{id}',
      emptyText: 'No photo requests received.',
    ),
    ActivityFeed(
      key: 'shortlistedBuyers',
      title: 'Shortlisted Buyers',
      path: '/get-favorite-buyer',
      queryKey: 'postedPhoneNumber',
      deletePath: '/favorite/delete/{phone}/{id}',
      undoPath: '/favorite/undo/{phone}/{id}',
      emptyText: 'No buyer has shortlisted your properties yet.',
    ),
    ActivityFeed(
      key: 'viewedBuyers',
      title: 'Viewed Buyers',
      path: '/property-buyer-viewed',
      emptyText: 'No views on your properties yet.',
    ),
    ActivityFeed(
      key: 'soldOutBuyers',
      title: 'Sold-Out Reports',
      path: '/get-soldout-buyer',
      queryKey: 'postedPhoneNumber',
      deletePath: '/soldout/delete/{phone}/{id}',
      undoPath: '/soldout/undo/{phone}/{id}',
      emptyText: 'No sold-out reports.',
    ),
    ActivityFeed(
      key: 'reportedBuyers',
      title: 'Reported By Buyers',
      path: '/get-reportproperty-buyer',
      queryKey: 'postedPhoneNumber',
      deletePath: '/reportproperty/delete/{phone}/{id}',
      undoPath: '/reportproperty/undo/{phone}/{id}',
      emptyText: 'No reports on your properties.',
    ),
    ActivityFeed(
      key: 'helpBuyers',
      title: 'Help Requests From Buyers',
      path: '/get-help-as-buyer',
      queryKey: 'postedPhoneNumber',
      deletePath: '/help/delete/{phone}/{id}',
      undoPath: '/help/undo/{phone}/{id}',
      emptyText: 'No help requests received.',
    ),
    ActivityFeed(
      key: 'addressRequestsOwner',
      title: 'Address Requests',
      path: '/address-requests/owner/{phone}',
      pathParam: true,
      deletePath: '/address-requests/delete/{id}',
      undoPath: '/address-requests/undo/{id}',
      emptyText: 'No address requests received.',
    ),
  ];

  /// Buyer menu — the signed-in user's own activity on other listings.
  static const List<ActivityFeed> buyerFeeds = [
    ActivityFeed(
      key: 'mySentInterest',
      title: 'My Sent Interest',
      path: '/get-interest-owner',
      deletePath: '/interest/delete/{phone}/{id}',
      undoPath: '/interest/undo/{phone}/{id}',
      emptyText: "You haven't sent interest to any property yet.",
    ),
    ActivityFeed(
      key: 'myMatchedProperties',
      title: 'My Matched Properties',
      path: '/fetch-owner-matched-properties',
      emptyText: 'No properties match your requirements yet.',
    ),
    ActivityFeed(
      key: 'myPhotoRequests',
      title: 'My Photo Requests',
      path: '/photo-requests/owner/{phone}',
      pathParam: true,
      deletePath: '/photo-requests/delete/{phone}/{id}',
      undoPath: '/photo-requests/undo/{phone}/{id}',
      emptyText: "You haven't requested photos yet.",
    ),
    ActivityFeed(
      key: 'myContacted',
      title: 'My Contacted Properties',
      path: '/get-contact-owner',
      emptyText: "You haven't contacted any owner yet.",
    ),
    ActivityFeed(
      key: 'myOffers',
      title: 'My Offers',
      path: '/offers/owner/{phone}',
      pathParam: true,
      deletePath: '/offers/delete/{phone}/{id}',
      undoPath: '/offers/undo/{phone}/{id}',
      emptyText: "You haven't made any offers yet.",
    ),
    ActivityFeed(
      key: 'myShortlist',
      title: 'My Shortlisted Properties',
      path: '/get-favorite-owner',
      deletePath: '/favorite/delete/{phone}/{id}',
      undoPath: '/favorite/undo/{phone}/{id}',
      emptyText: 'Your shortlist is empty.',
    ),
    ActivityFeed(
      key: 'myShortlistRemoved',
      title: 'Removed From Shortlist',
      path: '/get-favorite-owner',
      deletePath: '/favoriteRemoved/delete/{phone}/{id}',
      undoPath: '/favoriteRemoved/undo/{phone}/{id}',
      emptyText: 'Nothing removed from your shortlist.',
    ),
    // "My Last Viewed" and "My Most Viewed" return whole property documents, so
    // they render as property cards via PropertyFeedScreen (FeedSource.lastViewed
    // / .mostViewed) rather than through this activity-row list.
    ActivityFeed(
      key: 'mySoldOutReports',
      title: 'My Sold-Out Reports',
      path: '/get-soldOut-owner',
      deletePath: '/soldout/delete/{phone}/{id}',
      undoPath: '/soldout/undo/{phone}/{id}',
      emptyText: "You haven't reported any property as sold out.",
    ),
    ActivityFeed(
      key: 'myReports',
      title: 'My Reported Properties',
      path: '/get-reportProperty-owner',
      deletePath: '/reportproperty/delete/{phone}/{id}',
      undoPath: '/reportproperty/undo/{phone}/{id}',
      emptyText: "You haven't reported any property.",
    ),
    ActivityFeed(
      key: 'myHelpRequests',
      title: 'My Help Requests',
      path: '/get-help-as-owner',
      deletePath: '/help/delete/{phone}/{id}',
      undoPath: '/help/undo/{phone}/{id}',
      emptyText: "You haven't requested help yet.",
    ),
    ActivityFeed(
      key: 'myCalls',
      title: 'My Called List',
      path: '/user-call/property-owner/{phone}',
      pathParam: true,
      deletePath: '/user-call/soft-delete/{id}',
      undoPath: '/user-call/undo-delete/{id}',
      emptyText: "You haven't called any owner yet.",
    ),
    ActivityFeed(
      key: 'addressRequestsBuyer',
      title: 'My Address Requests',
      path: '/address-requests/buyer/{phone}',
      pathParam: true,
      deletePath: '/address-requests/delete/{id}',
      undoPath: '/address-requests/undo/{id}',
      emptyText: "You haven't requested any address.",
    ),
  ];

  static ActivityFeed? feedByKey(String key) {
    for (final f in [...ownerFeeds, ...buyerFeeds]) {
      if (f.key == key) return f;
    }
    return null;
  }

  static Future<List<ActivityEntry>> load(
    ActivityFeed feed,
    String phoneNumber,
  ) async {
    final body = feed.pathParam
        ? await _api.get(feed.resolve(feed.path, phoneNumber))
        : await _api.get(feed.path, query: {feed.queryKey: phoneNumber});
    return asList(body).map(ActivityEntry.fromJson).toList();
  }

  static Future<void> softDelete(
    ActivityFeed feed,
    String phoneNumber,
    String id,
  ) async {
    final path = feed.deletePath;
    if (path == null) return;
    await _api.delete(feed.resolve(path, phoneNumber, id: id));
  }

  static Future<void> undoDelete(
    ActivityFeed feed,
    String phoneNumber,
    String id,
  ) async {
    final path = feed.undoPath;
    if (path == null) return;
    await _api.put(feed.resolve(path, phoneNumber, id: id));
  }

  /// Accept / reject an offer (Offers From Buyers).
  static Future<void> respondToOffer({
    required String offerId,
    required bool accept,
  }) =>
      _api.post(accept ? '/accept-offer' : '/reject-offer', data: {'offerId': offerId});

  /// Owner sending photos in response to a request.
  static Future<void> sendPhotos({
    required String phoneNumber,
    required String ppcId,
  }) =>
      _api.post('/photos/send/$phoneNumber/$ppcId');

  static Future<void> rejectPhotoRequest(String requestId) =>
      _api.put('/photo-requests/reject/$requestId');

  /// Owner sharing the address after an address request.
  static Future<void> sendAddress(String requestId) =>
      _api.put('/address-requests/send/$requestId');
}
