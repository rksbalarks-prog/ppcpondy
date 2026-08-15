import 'package:flutter/foundation.dart';

import '../core/city_base.dart';
import '../core/formatters.dart';
import '../core/session.dart';
import '../services/account_service.dart';
import '../services/auth_service.dart';

/// App-wide session: who is signed in, which city they're browsing, and the
/// points balance shown in the navbar pill.
///
/// Replaces the web app's redux `userSlice` + `PhoneNumberContext` + the
/// `points:updated` window event.
class SessionProvider extends ChangeNotifier {
  /// Full number as stored on the web, e.g. "+919876543210".
  String? _phoneNumber;

  String _activeBase = 'PY';
  num _pointsBalance = 0;
  int _unreadNotifications = 0;

  String? get phoneNumber => _phoneNumber;

  /// Bare 10-digit number — what most endpoints key on.
  String get phoneDigits => Fmt.plainPhone(_phoneNumber);

  bool get isLoggedIn => (_phoneNumber ?? '').isNotEmpty;

  String get activeBase => _activeBase;
  String get activeCity => CityBase.cityName(_activeBase);

  num get pointsBalance => _pointsBalance;
  int get unreadNotifications => _unreadNotifications;

  /// Restore from storage at startup.
  Future<void> bootstrap() async {
    await Session.init();
    _activeBase = await CityBase.load();
    final stored = Session.getString(Session.kPhoneNumber);
    if (stored != null && Fmt.plainPhone(stored).length == 10) {
      _phoneNumber = stored;
    }
    notifyListeners();
    if (isLoggedIn) {
      unawaited(AuthService.logAppOpen(phoneDigits));
      unawaited(refreshPoints());
      unawaited(refreshUnread());
    }
  }

  Future<void> signIn(String fullPhoneNumber, {bool freshLogin = true}) async {
    _phoneNumber = fullPhoneNumber;
    await Session.setString(Session.kPhoneNumber, fullPhoneNumber);
    await Session.setBool(Session.kFreshLogin, freshLogin);
    notifyListeners();
    unawaited(AuthService.logAppOpen(phoneDigits));
    unawaited(refreshPoints());
    unawaited(refreshUnread());
  }

  Future<void> signOut() async {
    final previous = _phoneNumber;
    _phoneNumber = null;
    _pointsBalance = 0;
    _unreadNotifications = 0;
    await Session.remove(Session.kPhoneNumber);
    await Session.remove(Session.kLastActiveContent);
    notifyListeners();
    if (previous != null) {
      // Same non-blocking WhatsApp notice the web Navbar sends.
      unawaited(AuthService.sendWhatsApp(previous, AuthService.logoutMessage));
    }
  }

  Future<void> switchCity(String base) async {
    if (base == _activeBase) return;
    await CityBase.setActive(base);
    _activeBase = CityBase.active;
    notifyListeners();
  }

  Future<void> refreshPoints() async {
    if (!isLoggedIn) return;
    final balance = await AccountService.pointsBalance(_phoneNumber!);
    if (balance != _pointsBalance) {
      _pointsBalance = balance;
      notifyListeners();
    }
  }

  Future<void> refreshUnread() async {
    if (!isLoggedIn) return;
    final count = await AccountService.unreadCount(_phoneNumber!);
    if (count != _unreadNotifications) {
      _unreadNotifications = count;
      notifyListeners();
    }
  }

  void clearUnreadBadge() {
    if (_unreadNotifications == 0) return;
    _unreadNotifications = 0;
    notifyListeners();
  }
}

/// Local `unawaited` so we don't pull in dart:async at every call site.
void unawaited(Future<void> future) {
  future.catchError((_) {});
}
