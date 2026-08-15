import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/misc_models.dart';
import '../../services/account_service.dart';
import '../../services/auth_service.dart';
import '../../state/session_provider.dart';
import '../../widgets/common.dart';

/// MyProfile.jsx — create/update the user's name, email and address.
class MyProfileScreen extends StatefulWidget {
  const MyProfileScreen({super.key});

  @override
  State<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends State<MyProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();

  UserProfile? _profile;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final session = context.read<SessionProvider>();
    if (!session.isLoggedIn) {
      setState(() {
        _loading = false;
        _error = 'Please log in first.';
      });
      return;
    }
    AuthService.recordView(session.phoneNumber, 'My Profile');
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profile = await AccountService.fetchProfile(session.phoneNumber!);
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _nameController.text = profile.name;
        _emailController.text = profile.email;
        _addressController.text = profile.address;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = describeError(e);
        _loading = false;
      });
    }
  }

  Future<void> _save() async {
    final profile = _profile;
    if (profile == null) return;
    if (_nameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _addressController.text.trim().isEmpty) {
      showToast(context, 'Please fill all fields', error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      profile
        ..name = _nameController.text.trim()
        ..email = _emailController.text.trim()
        ..address = _addressController.text.trim();

      if (profile.exists) {
        await AccountService.updateProfile(profile);
      } else {
        final created = await AccountService.createProfile(profile);
        if (mounted) setState(() => _profile = created);
      }
      if (mounted) showToast(context, 'Profile saved.');
    } catch (e) {
      if (mounted) showToast(context, describeError(e), error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(title: const Text('My Profile')),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _form(),
    );
  }

  Widget _form() {
    final session = context.watch<SessionProvider>();
    final profile = _profile!;

    return ListView(
      padding: const EdgeInsets.only(top: 20, bottom: 30),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 44,
                backgroundColor: AppColors.teal,
                child: Text(
                  profile.initial,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                profile.name.isEmpty ? 'Welcome!' : profile.name,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              Text(
                session.phoneNumber ?? '',
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Profile Details',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.teal,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full Name'),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _addressController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Address'),
              ),
              const SizedBox(height: 14),
              TextField(
                enabled: false,
                controller: TextEditingController(text: profile.mobile),
                decoration: const InputDecoration(
                  labelText: 'Mobile (cannot be changed)',
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.teal,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(profile.exists ? 'UPDATE PROFILE' : 'CREATE PROFILE'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
