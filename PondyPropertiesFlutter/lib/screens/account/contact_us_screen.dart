import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../services/account_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// ContactUs.jsx / ContactedPage.jsx — support contact details plus the
/// enquiry form that posts to `/contactUs`.
class ContactUsScreen extends StatefulWidget {
  const ContactUsScreen({super.key});

  @override
  State<ContactUsScreen> createState() => _ContactUsScreenState();
}

class _ContactUsScreenState extends State<ContactUsScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _message = TextEditingController();

  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _phone.text = context.read<SessionProvider>().phoneDigits;
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_name.text.trim().isEmpty ||
        _phone.text.trim().isEmpty ||
        _message.text.trim().isEmpty) {
      showToast(context, 'Name, phone and message are required.', error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      await AccountService.submitContactUs({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'phoneNumber': _phone.text.trim(),
        'message': _message.text.trim(),
      });
      if (!mounted) return;
      _message.clear();
      showToast(context, 'Thanks! We will get back to you shortly.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(title: const Text('Contact Us')),
      body: ListView(
        padding: const EdgeInsets.only(top: 14, bottom: 30),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Talk to us',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(height: 12),
                _contactTile(
                  Icons.phone,
                  'Call us',
                  AppConfig.supportPhone,
                  () => dialPhone(context, AppConfig.supportPhone),
                ),
                _contactTile(
                  Icons.chat,
                  'WhatsApp',
                  AppConfig.supportPhone,
                  () => openWhatsApp(
                    context,
                    AppConfig.supportPhone,
                    'Hi, I need help with Pondy Property.',
                  ),
                ),
                _contactTile(
                  Icons.mail_outline,
                  'Email',
                  AppConfig.supportEmail,
                  () => launchExternal(
                    context,
                    'mailto:${AppConfig.supportEmail}',
                  ),
                ),
              ],
            ),
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Send us a message',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Your Name *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone Number *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _message,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'Message *'),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _sending ? null : _send,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _sending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('SEND MESSAGE'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _contactTile(
    IconData icon,
    String label,
    String value,
    VoidCallback onTap,
  ) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.searchBottom,
        child: Icon(icon, size: 18, color: AppColors.teal),
      ),
      title: Text(label, style: const TextStyle(fontSize: 13)),
      subtitle: Text(
        value,
        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
      ),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
}
