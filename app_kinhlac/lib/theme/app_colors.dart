import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color brown50 = Color(0xFFFDF8F1);
  static const Color brown100 = Color(0xFFF5E6D0);
  static const Color brown200 = Color(0xFFE8CDA5);
  static const Color brown300 = Color(0xFFD4A76A);
  static const Color brown400 = Color(0xFFC08B42);
  static const Color brown500 = Color(0xFFA67235);
  static const Color brown600 = Color(0xFF8B5E2F);
  static const Color brown700 = Color(0xFF6F4B26);
  static const Color brown800 = Color(0xFF553A1E);
  static const Color brown900 = Color(0xFF3B2814);

  static const Color white = Color(0xFFFFFFFF);
  static const Color gray50 = Color(0xFFFAFAFA);
  static const Color gray100 = Color(0xFFF5F5F5);
  static const Color gray200 = Color(0xFFEEEEEE);
  static const Color gray300 = Color(0xFFE0E0E0);
  static const Color gray400 = Color(0xFFBDBDBD);
  static const Color gray500 = Color(0xFF9E9E9E);
  static const Color gray600 = Color(0xFF757575);
  static const Color gray700 = Color(0xFF616161);
  static const Color gray800 = Color(0xFF424242);
  static const Color gray900 = Color(0xFF212121);
  static const Color black = Color(0xFF1A1A1A);

  static const Color primary = brown600;
  static const Color primaryLight = brown400;
  static const Color primaryDark = brown800;
  static const Color primaryBg = brown50;

  static const Color danger = Color(0xFFC0392B);
  static const Color success = Color(0xFF27AE60);
  static const Color warning = Color(0xFFE67E22);
  static const Color info = Color(0xFF2980B9);

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brown700, brown900],
  );

  static const LinearGradient buttonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brown600, brown700],
  );
}
