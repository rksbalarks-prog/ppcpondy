import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:pondy_properties/assistant/assistant_client.dart';
import 'package:pondy_properties/assistant/assistant_controller.dart';
import 'package:pondy_properties/assistant/assistant_strings.dart';
import 'package:pondy_properties/core/formatters.dart';
import 'package:pondy_properties/main.dart';
import 'package:pondy_properties/models/property.dart';
import 'package:pondy_properties/state/session_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Fmt', () {
    test('formats Indian rupee amounts the way the web app does', () {
      expect(Fmt.price(4500000), '45.00 Lakhs');
      expect(Fmt.price(12500000), '1.25 Cr');
      expect(Fmt.price(45000), '45,000');
      expect(Fmt.price('On Demand'), 'On Demand');
      expect(Fmt.price(null), 'N/A');
    });

    test('groups digits in the Indian style', () {
      expect(Fmt.indianNumber(1234567), '12,34,567');
      expect(Fmt.indianNumber(999), '999');
    });

    test('compacts points for the navbar pill', () {
      expect(Fmt.points(999), '999');
      expect(Fmt.points(1500), '1.5K');
      expect(Fmt.points(10000), '10K');
      expect(Fmt.points(1200000), '1.2M');
    });

    test('normalises phone numbers to the backend format', () {
      expect(Fmt.plainPhone('+91 98765 43210'), '9876543210');
      expect(Fmt.whatsAppNumber('9876543210'), '919876543210');
    });
  });

  group('Property', () {
    test('reads a loosely-typed backend document', () {
      final p = Property({
        'ppcId': '10245',
        'propertyType': 'individual house',
        'propertyMode': 'sale',
        'price': 4500000,
        'nagar': 'anna nagar',
        'city': 'PONDICHERRY',
        'state': 'Puducherry',
        'photos': [r'uploads\a.jpg'],
        'views': 12,
      });

      expect(p.priceLabel, '45.00 Lakhs');
      expect(p.locationLine, 'Anna nagar, Pondicherry, Puducherry');
      expect(p.coverPhotoUrl, 'https://ppcpondy.com/PPC/uploads/a.jpg');
      expect(p.views, 12);
      expect(p.isOnDemand, isFalse);
    });

    test('treats admin "On Demand" pricing as a string', () {
      expect(Property({'price': 'On Demand'}).isOnDemand, isTrue);
      expect(Property({'onDemand': true}).priceLabel, 'On Demand');
    });

    test('parses map coordinates out of the stored string', () {
      final coords = Property({'locationCoordinates': '11.9416, 79.8083'}).coordinates;
      expect(coords, isNotNull);
      expect(coords!.lat, closeTo(11.9416, 0.0001));
      expect(coords.lng, closeTo(79.8083, 0.0001));
    });
  });

  testWidgets('app boots to the login screen when signed out', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final session = SessionProvider();
    await session.bootstrap();

    // PondyPropertiesApp requires the assistant controller main.dart hands it;
    // built here the same way so the widget tree matches the real app.
    final assistant = AssistantController(
      client: AssistantClient(),
      phoneProvider: () => session.phoneNumber ?? '',
      loginFirstMessage: AssistantT.en.loginFirst,
    );

    await tester.pumpWidget(
      PondyPropertiesApp(session: session, assistant: assistant),
    );
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
