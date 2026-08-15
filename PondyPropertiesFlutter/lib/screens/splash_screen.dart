import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../routes.dart';
import '../state/session_provider.dart';

/// Decides between the login screen and the feed, the way MoblieViews.jsx does
/// when it reads `localStorage.phoneNumber` on mount.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _route());
  }

  Future<void> _route() async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    final loggedIn = context.read<SessionProvider>().isLoggedIn;
    Navigator.pushReplacementNamed(
      context,
      loggedIn ? AppRoutes.home : AppRoutes.login,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.teal,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset(
                'assets/images/ppc_logo.jpg',
                width: 96,
                height: 96,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.home_work, size: 80, color: Colors.white),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Pondy Property',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Property & Rentals',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 28),
            const SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
