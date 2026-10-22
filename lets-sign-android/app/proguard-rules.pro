# ProGuard rules for LetsSign Android

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keep class androidx.hilt.** { *; }

# Keep Kotlin serialization
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.Serializable *;
}

# Keep Room database
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class * implements androidx.room.Dao { *; }

# Keep Retrofit
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }

# Keep Coil
-keep class coil.** { *; }

# Keep PDF Viewer
-keep class com.github.barteksc.pdfviewer.** { *; }

# Keep Hilt ViewModel
-keep class androidx.hilt.navigation.compose.** { *; }

# Keep our models
-keep class com.letsign.mobile.domain.model.** { *; }

# Keep ViewModels
-keep class com.letsign.mobile.presentation.viewmodel.** { *; }

# Keep Hilt EntryPoints
-keep class dagger.hilt.android.** { *; }

# Don't warn about unused
-dontwarn kotlinx.coroutines.**
-dontwarn kotlinx.serialization.**
-dontwarn androidx.room.**
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn coil.**