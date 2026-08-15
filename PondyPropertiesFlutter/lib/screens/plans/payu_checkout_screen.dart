import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/formatters.dart';
import '../../core/theme.dart';
import '../../services/account_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// PayUForm.jsx — asks the backend to sign the transaction, then POSTs the
/// signed fields to PayU's hosted checkout.
///
/// The web builds a hidden `<form>` and submits it; here we load an equivalent
/// auto-submitting HTML document into a WebView and watch the redirect URL for
/// the success/failure callback.
class PayuCheckoutScreen extends StatefulWidget {
  const PayuCheckoutScreen({super.key, required this.params});

  /// Expects: endpoint, laterEndpoint, planName, planId, amount, phone, ppcId.
  final Map<String, dynamic> params;

  @override
  State<PayuCheckoutScreen> createState() => _PayuCheckoutScreenState();
}

class _PayuCheckoutScreenState extends State<PayuCheckoutScreen> {
  WebViewController? _controller;
  bool _starting = false;
  bool _launched = false;
  String? _error;
  String? _outcome;

  String get _planName => '${widget.params['planName'] ?? 'Plan'}';
  num get _amount => num.tryParse('${widget.params['amount']}') ?? 0;

  Future<void> _payNow() async {
    setState(() {
      _starting = true;
      _error = null;
    });
    try {
      // A transaction id the backend can key the callback on.
      final txnid = 'txn_${DateTime.now().millisecondsSinceEpoch}';
      final session = context.read<SessionProvider>();

      final signed = await AccountService.initiatePayU(
        endpoint: '${widget.params['endpoint']}',
        payload: {
          'txnid': txnid,
          'amount': '${widget.params['amount']}',
          'productinfo': '${widget.params['productinfo'] ?? _planName}',
          'firstname': 'Owner',
          'email': 'owner$txnid@gmail.com',
          'phone': '${widget.params['phone'] ?? session.phoneDigits}',
          'planName': _planName,
          'planId': '${widget.params['planId'] ?? ''}',
          'ppcId': '${widget.params['ppcId'] ?? ''}',
          'payustatususer': 'pay now',
        },
      );

      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onUrlChange: (change) => _inspect(change.url),
            onPageFinished: (url) => _inspect(url),
          ),
        )
        ..loadHtmlString(_autoSubmitForm(signed));

      if (!mounted) return;
      setState(() {
        _controller = controller;
        _launched = true;
        _starting = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _starting = false;
      });
    }
  }

  Future<void> _payLater() async {
    final endpoint = widget.params['laterEndpoint'];
    if (endpoint == null) {
      Navigator.pop(context);
      return;
    }
    setState(() => _starting = true);
    try {
      final session = context.read<SessionProvider>();
      await AccountService.payLater(
        endpoint: '$endpoint',
        payload: {
          'planName': _planName,
          'planId': '${widget.params['planId'] ?? ''}',
          'amount': '${widget.params['amount']}',
          'phone': '${widget.params['phone'] ?? session.phoneDigits}',
          'ppcId': '${widget.params['ppcId'] ?? ''}',
          'payustatususer': 'pay later',
        },
      );
      if (!mounted) return;
      showToast(context, 'Saved. Our team will contact you to collect payment.');
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _starting = false;
      });
    }
  }

  /// Detect PayU's return URL so we can show the result instead of leaving the
  /// user on a raw callback page.
  void _inspect(String? url) {
    if (url == null || _outcome != null) return;
    final lower = url.toLowerCase();
    if (lower.contains('success')) {
      setState(() => _outcome = 'success');
      context.read<SessionProvider>().refreshPoints();
    } else if (lower.contains('failure') || lower.contains('cancel')) {
      setState(() => _outcome = 'failure');
    }
  }

  String _autoSubmitForm(Map<String, dynamic> fields) {
    final inputs = fields.entries
        .map((e) =>
            '<input type="hidden" name="${_escape(e.key)}" value="${_escape('${e.value}')}"/>')
        .join('\n');
    return '''
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="font-family:sans-serif;text-align:center;padding-top:80px;color:#5E5E5E">
  <p>Redirecting to the secure payment page…</p>
  <form id="payu" method="POST" action="${AppConfig.payuAction}">
$inputs
  </form>
  <script>document.getElementById('payu').submit();</script>
</body>
</html>''';
  }

  static String _escape(String value) => value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Checkout')),
      body: _outcome != null
          ? _result()
          : _launched && _controller != null
              ? WebViewWidget(controller: _controller!)
              : _summary(),
    );
  }

  Widget _summary() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppCard(
          margin: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Order Summary',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.teal,
                ),
              ),
              const Divider(height: 20),
              SpecRow(label: 'Plan', value: _planName, icon: Icons.workspace_premium),
              if ('${widget.params['ppcId'] ?? ''}'.isNotEmpty)
                SpecRow(
                  label: 'For property',
                  value: 'PPC-${widget.params['ppcId']}',
                  icon: Icons.home_outlined,
                ),
              SpecRow(
                label: 'Mobile',
                value: '${widget.params['phone'] ?? ''}',
                icon: Icons.phone,
              ),
              const Divider(height: 20),
              Row(
                children: [
                  const Text(
                    'Amount payable',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  Text(
                    '₹${Fmt.indianNumber(_amount)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.tealDark,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            style: const TextStyle(fontSize: 13, color: AppColors.onDemand),
          ),
        ],
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _starting ? null : _payNow,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF00ADF2),
            padding: const EdgeInsets.symmetric(vertical: 15),
          ),
          child: _starting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('PAY NOW'),
        ),
        const SizedBox(height: 10),
        OutlinedButton(
          onPressed: _starting ? null : _payLater,
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF00ADF2),
            side: const BorderSide(color: Color(0xFF00ADF2)),
            padding: const EdgeInsets.symmetric(vertical: 15),
          ),
          child: const Text('PAY LATER'),
        ),
        const SizedBox(height: 14),
        const Text(
          'Payments are processed by PayU on their secure hosted page. '
          'Pondy Property never sees your card details.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11.5, color: AppColors.textFaint),
        ),
      ],
    );
  }

  Widget _result() {
    final success = _outcome == 'success';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              success ? Icons.check_circle : Icons.cancel,
              size: 88,
              color: success ? const Color(0xFF2E7D32) : AppColors.onDemand,
            ),
            const SizedBox(height: 16),
            Text(
              success ? 'Payment successful' : 'Payment failed',
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              success
                  ? '$_planName is now active on your account.'
                  : 'The transaction did not go through. No amount was deducted, '
                      'or it will be refunded automatically.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(backgroundColor: AppColors.teal),
              child: const Text('Done'),
            ),
            if (!success)
              TextButton(
                onPressed: () => setState(() {
                  _outcome = null;
                  _launched = false;
                  _controller = null;
                }),
                child: const Text('Try again'),
              ),
          ],
        ),
      ),
    );
  }
}
