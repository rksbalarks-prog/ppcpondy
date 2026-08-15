import 'package:intl/intl.dart';

import 'config.dart';

/// Number / date / URL helpers ported from the React components so values
/// render identically (Indian grouping, Lakhs/Cr, "12 Jan 2025", ...).
class Fmt {
  Fmt._();

  /// Indian digit grouping: 1234567 -> "12,34,567".
  static String indianNumber(num value) {
    final s = value.toInt().abs().toString();
    if (s.length <= 3) return (value < 0 ? '-' : '') + s;
    final lastThree = s.substring(s.length - 3);
    final other = s.substring(0, s.length - 3);
    final grouped = other.replaceAllMapped(
      RegExp(r'\B(?=(\d{2})+(?!\d))'),
      (m) => ',',
    );
    return '${value < 0 ? '-' : ''}$grouped,$lastThree';
  }

  /// formatPrice() from PropertyCards.jsx — Cr / Lakhs / grouped rupees.
  static String price(dynamic raw) {
    if (raw == null) return 'N/A';
    if (raw is String) {
      if (raw.trim().toLowerCase() == 'on demand') return 'On Demand';
      final parsed = num.tryParse(raw.replaceAll(',', '').trim());
      if (parsed == null) return raw.isEmpty ? 'N/A' : raw;
      return price(parsed);
    }
    final n = raw as num;
    if (n <= 0) return 'N/A';
    if (n >= 10000000) return '${(n / 10000000).toStringAsFixed(2)} Cr';
    if (n >= 100000) return '${(n / 100000).toStringAsFixed(2)} Lakhs';
    return indianNumber(n);
  }

  /// Compact points balance for the navbar pill: 1500 -> "1.5K".
  static String points(num? raw) {
    final n = (raw ?? 0).toDouble();
    if (n < 1000) return n.toInt().toString();
    String trim(String s) => s.endsWith('.0') ? s.substring(0, s.length - 2) : s;
    if (n < 1000000) return '${trim((n / 1000).toStringAsFixed(1))}K';
    if (n < 1000000000) return '${trim((n / 1000000).toStringAsFixed(1))}M';
    return '${trim((n / 1000000000).toStringAsFixed(1))}B';
  }

  static final DateFormat _dMonY = DateFormat('d MMM yyyy', 'en_IN');
  static final DateFormat _dMonYTime = DateFormat('d MMM yyyy, h:mm a', 'en_IN');

  static DateTime? parseDate(dynamic raw) {
    if (raw == null) return null;
    if (raw is DateTime) return raw;
    return DateTime.tryParse(raw.toString())?.toLocal();
  }

  /// toLocaleDateString('en-IN', {year,month,day}) equivalent.
  static String date(dynamic raw) {
    final d = parseDate(raw);
    return d == null ? 'N/A' : _dMonY.format(d);
  }

  static String dateTime(dynamic raw) {
    final d = parseDate(raw);
    return d == null ? 'N/A' : _dMonYTime.format(d);
  }

  /// "2 hours ago" style label used on notification rows.
  static String relative(dynamic raw) {
    final d = parseDate(raw);
    if (d == null) return '';
    final diff = DateTime.now().difference(d);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return _dMonY.format(d);
  }

  /// Capitalise the first letter, matching `str.charAt(0).toUpperCase() + …`.
  static String cap(dynamic raw) {
    final s = (raw ?? '').toString().trim();
    if (s.isEmpty) return 'N/A';
    return s[0].toUpperCase() + s.substring(1);
  }

  /// Title-case for location parts (`Val.charAt(0).toUpperCase() + rest.toLowerCase()`).
  static String titleCase(dynamic raw) {
    final s = (raw ?? '').toString().trim();
    if (s.isEmpty) return '';
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }

  /// Ordinal floor label: 1 -> "1st", 2 -> "2nd" …
  static String ordinalFloor(dynamic raw) {
    final n = int.tryParse((raw ?? '').toString());
    if (n == null) return (raw ?? '').toString();
    if (n == 0) return 'Ground';
    final mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return '${n}th';
    switch (n % 10) {
      case 1:
        return '${n}st';
      case 2:
        return '${n}nd';
      case 3:
        return '${n}rd';
      default:
        return '${n}th';
    }
  }

  /// Build an absolute media URL from a backend-relative path.
  /// The web app does: `https://ppcpondy.com/PPC/${path.replace(/\\/g,'/')}`.
  static String? mediaUrl(dynamic rawPath) {
    if (rawPath == null) return null;
    var p = rawPath.toString().trim();
    if (p.isEmpty) return null;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    p = p.replaceAll(r'\', '/').replaceAll(RegExp(r'^/+'), '');
    return '${AppConfig.fileHost}/$p';
  }

  /// Last 10 digits — the backend keys most user records on the bare number.
  static String plainPhone(String? raw) {
    final digits = (raw ?? '').replaceAll(RegExp(r'\D'), '');
    return digits.length > 10 ? digits.substring(digits.length - 10) : digits;
  }

  /// 10-digit number -> 91XXXXXXXXXX for the WhatsApp send-message endpoint.
  static String whatsAppNumber(String? raw) {
    final digits = (raw ?? '').replaceAll(RegExp(r'\D'), '');
    return digits.length == 10 ? '91$digits' : digits;
  }
}
