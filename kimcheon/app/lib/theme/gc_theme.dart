import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'gc_colors.dart';

class GcTheme {
  GcTheme._();

  static const font = 'Pretendard';

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: GcColors.navy,
      primary: GcColors.navy,
      onPrimary: Colors.white,
      secondary: GcColors.biCyan,
      tertiary: GcColors.sunOrange,
      error: GcColors.error,
      surface: GcColors.surface,
      onSurface: GcColors.text,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: font,
      scaffoldBackgroundColor: GcColors.bg,
      splashFactory: InkSparkle.splashFactory,
    );

    final text = base.textTheme.apply(bodyColor: GcColors.text, displayColor: GcColors.text, fontFamily: font);

    return base.copyWith(
      textTheme: text.copyWith(
        headlineSmall: text.headlineSmall?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.6),
        titleLarge: text.titleLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.5),
        titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3),
        titleSmall: text.titleSmall?.copyWith(fontWeight: FontWeight.w600, letterSpacing: -0.2),
        bodyLarge: text.bodyLarge?.copyWith(letterSpacing: -0.3, height: 1.5),
        bodyMedium: text.bodyMedium?.copyWith(letterSpacing: -0.2, height: 1.5, color: GcColors.text),
        bodySmall: text.bodySmall?.copyWith(letterSpacing: -0.1, color: GcColors.textMute),
        labelLarge: text.labelLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.2),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: GcColors.surface,
        foregroundColor: GcColors.text,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        titleTextStyle: TextStyle(
          fontFamily: font,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: GcColors.text,
          letterSpacing: -0.4,
        ),
      ),
      cardTheme: CardThemeData(
        color: GcColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      dividerTheme: const DividerThemeData(color: GcColors.line, thickness: 1, space: 1),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: GcColors.navy,
          foregroundColor: Colors.white,
          disabledBackgroundColor: GcColors.disabled,
          disabledForegroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: font, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: GcColors.navy,
          minimumSize: const Size.fromHeight(54),
          side: const BorderSide(color: GcColors.line),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontFamily: font, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: GcColors.navy,
          textStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GcColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: const TextStyle(color: GcColors.textMute, fontWeight: FontWeight.w400),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GcColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GcColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GcColors.navy, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GcColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: GcColors.error, width: 1.6),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: GcColors.surface,
        selectedColor: GcColors.navy,
        side: const BorderSide(color: GcColors.line),
        labelStyle: const TextStyle(fontFamily: font, fontWeight: FontWeight.w600, fontSize: 14),
        shape: const StadiumBorder(),
        showCheckmark: false,
      ),
      tabBarTheme: const TabBarThemeData(
        labelColor: GcColors.navy,
        unselectedLabelColor: GcColors.textMute,
        indicatorColor: GcColors.navy,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: TextStyle(fontFamily: font, fontWeight: FontWeight.w700, fontSize: 15),
        unselectedLabelStyle: TextStyle(fontFamily: font, fontWeight: FontWeight.w500, fontSize: 15),
        dividerColor: GcColors.line,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: GcColors.text,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentTextStyle: const TextStyle(fontFamily: font, color: Colors.white, fontWeight: FontWeight.w500),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: GcColors.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: GcColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
