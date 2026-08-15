import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const FAQ = () => {
  const faqData = [
    {
      category: 'General Questions',
      items: [
        {
          question: 'What is the Pondy Property App?',
          answer:
            'The Property App is a mobile/web application designed to help users buy, sell, or manage properties. It provides real estate listings, virtual tours, mortgage calculators, and agent connections.',
        },
        {
          question: 'Is the app free to use?',
          answer:
            'Yes, the basic features (browsing listings, saving favourites, and contacting agents) are free. Some premium features (e.g., advanced filters, priority listings) may require a subscription.',
        },
        {
          question: 'Which platforms is the app available on?',
          answer:
            'The app is available for Android (Google Play). A web version is also accessible via browser www.ppcpondy.com. iOS (App Store) is under development.',
        },
      ],
    },
    {
      category: 'Account & Registration',
      items: [
        {
          question: 'How do I create an account?',
          answer: 'You can sign up using your phone number and verify using OTP.',
        },
        {
          question: 'Can I use the app without an account?',
          answer:
            'No, you can’t browse listings, but a Verified account is required to save favorites, contact agents, or post properties.',
        },
      ],
    },
    {
      category: 'Property Listings',
      items: [
        {
          question: 'How do I search for properties?',
          answer:
            'Use filters like location, price range, property type (house, apartment, land), bedrooms, and amenities to refine your search.',
        },
        {
          question: 'Are the listings verified?',
          answer:
            'We strive to verify listings, but we recommend visiting properties in person or consulting an agent before making decisions.',
        },
        {
          question: 'Can I save properties to view later?',
          answer: 'Yes, tap the heart (❤️) icon to save properties to your Favorites list.',
        },
        {
          question: 'How do I report a fake or suspicious listing?',
          answer:
            'Click the "Report Listing" button on the property page or contact our support team.',
        },
      ],
    },
    {
      category: 'Buying, Selling & Renting',
      items: [
        {
          question: 'How do I list my property for sale/rent?',
          answer: 'Go to "Post a Property", fill in details, upload photos, and submit for approval.',
        },
        {
          question: 'Are there fees for listing a property?',
          answer: 'Basic listings are free, but featured listings (higher visibility) may have a fee.',
        },
        {
          question: 'How do I contact a seller/agent?',
          answer: 'Tap "Contact Agent" on the property page to call, message, or email/call them directly.',
        },
        {
          question: 'Can I negotiate the price through the app?',
          answer: 'Yes, you can message through the OFFER BUTTON to the seller/agent to discuss pricing and terms.',
        },
      ],
    },
    {
      category: 'Payments & Security',
      items: [
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, we use encrypted payment gateways and do not store your card details.',
        },
        {
          question: 'What payment methods are accepted?',
          answer:
            'Credit/debit cards, bank transfers, UPI and digital wallets (Apple Pay, Google Pay, etc.).',
        },
      ],
    },
    {
      category: 'Technical Support',
      items: [
        {
          question: 'The app is crashing. What should I do?',
          answer:
            'Try restarting the app, updating it, or reinstalling. If issues persist, contact support.',
        },
        {
          question: 'How do I update my app?',
          answer: 'Visit Google Play (Android) and check for updates.',
        },
        {
          question: 'How can I delete my account?',
          answer: 'Go to Settings > Account > Delete Account (data will be permanently removed).',
        },
      ],
    },
  ];

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Frequently Asked Questions (FAQ)</h2>
      {faqData.map((section, index) => (
        <div key={index} className="mb-5">
          <h4 className="mb-3" style={{color:"#004E9D"}}>{section.category}</h4>
          {section.items.map((item, idx) => (
            <div key={idx} className="mb-3">
              <strong>{item.question}</strong>
              <p className="text-secondary mb-0">{item.answer}</p>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-5">
        <h5 style={{color:"#101080"}}>Contact & Support</h5>
        <p className="text-secondary mb-1">📧 Email: support@pondyproperty.com</p>
        <p className="text-secondary mb-0">📞 Phone: +91 9150524409 / +91 413 2914409</p>
      </div>
    </div>
  );
};

export default FAQ;
