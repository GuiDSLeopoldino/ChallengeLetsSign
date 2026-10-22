package com.letsign.mobile.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFFC2185B),
    primaryContainer = Color(0xFFFCE4EC),
    secondary = Color(0xFF3F51B5),
    secondaryContainer = Color(0xFFE8EAF6),
    tertiary = Color(0xFF009688),
    tertiaryContainer = Color(0xFFE0F2F1),
    surface = Color(0xFFFFFFFF),
    background = Color(0xFFF5F5F5),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onSurface = Color(0xFF1D1D1D),
    onBackground = Color(0xFF1D1D1D),
    error = Color(0xFFF44336),
    errorContainer = Color(0xFFFFEBEE),
    onError = Color.White,
    onErrorContainer = Color(0xFFC62828)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFF8BBD0),
    primaryContainer = Color(0xFF880E4F),
    secondary = Color(0xFFC5CAE9),
    secondaryContainer = Color(0xFF1A237E),
    tertiary = Color(0xFF80CBC4),
    tertiaryContainer = Color(0xFF004D40),
    surface = Color(0xFF1E1E1E),
    background = Color(0xFF121212),
    onPrimary = Color(0xFF1D1D1D),
    onSecondary = Color(0xFF1D1D1D),
    onTertiary = Color(0xFF1D1D1D),
    onSurface = Color(0xFFE6E6E6),
    onBackground = Color(0xFFE6E6E6),
    error = Color(0xFFEF5350),
    errorContainer = Color(0xFFB71C1C),
    onError = Color(0xFF1D1D1D),
    onErrorContainer = Color(0xFFFFFFFF)
)

@Composable
fun LetsSignTheme(
    darkTheme: Boolean = androidx.compose.material3.isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

// Typography
val Typography = androidx.compose.material3.Typography(
    displayLarge = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = androidx.compose.ui.unit.sp(64)
    ),
    displayMedium = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 45.sp,
        lineHeight = androidx.compose.ui.unit.sp(52)
    ),
    displaySmall = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 36.sp,
        lineHeight = androidx.compose.ui.unit.sp(44)
    ),
    headlineLarge = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = androidx.compose.ui.unit.sp(40)
    ),
    headlineMedium = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = androidx.compose.ui.unit.sp(36)
    ),
    headlineSmall = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = androidx.compose.ui.unit.sp(32)
    ),
    titleLarge = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = androidx.compose.ui.unit.sp(28)
    ),
    titleMedium = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = androidx.compose.ui.unit.sp(24)
    ),
    titleSmall = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = androidx.compose.ui.unit.sp(20)
    ),
    bodyLarge = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = androidx.compose.ui.unit.sp(24)
    ),
    bodyMedium = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = androidx.compose.ui.unit.sp(20)
    ),
    bodySmall = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = androidx.compose.ui.unit.sp(16)
    ),
    labelLarge = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = androidx.compose.ui.unit.sp(20)
    ),
    labelMedium = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = androidx.compose.ui.unit.sp(16)
    ),
    labelSmall = androidx.compose.material3.TextStyle(
        fontFamily = androidx.compose.ui.text.font.FontFamily.Default,
        fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = androidx.compose.ui.unit.sp(16)
    )
)

// Shapes
val Shapes = androidx.compose.material3.Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(4.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(28.dp)
)

import androidx.compose.ui.unit.sp