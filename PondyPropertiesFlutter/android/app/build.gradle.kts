import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Firebase Cloud Messaging. The google-services plugin reads
// android/app/google-services.json (project ppcpondy-9e33d, package
// com.apps.ppcpondy — google-services matches on applicationId, not namespace).
//
// Applied conditionally, and NOT from the plugins {} block, because that block
// is declarative and cannot contain an `if`. Without the JSON the plugin would
// hard-fail the build with "File google-services.json is missing"; skipping it
// keeps the app building, with push simply inert (PushService catches the
// Firebase init failure and every method becomes a no-op).
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
} else {
    logger.lifecycle("google-services.json not found — FCM push disabled in this build.")
}

// Release signing credentials live in android/key.properties (git-ignored, not
// committed). If it's missing we fall back to debug signing so `flutter run
// --release` still works on a fresh checkout.
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.ppcpondy.pondy_properties"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // flutter_local_notifications (used to show FOREGROUND push banners)
        // ships an AAR that needs java.time backported onto older Android
        // versions. Without this the build fails outright at
        // :app:checkDebugAarMetadata with "requires core library desugaring to
        // be enabled" — it is a hard build error, not a warning, so push
        // cannot be shipped without it.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // The published app on Google Play. This MUST stay
        // com.apps.ppcpondy: Play identifies an app by its applicationId and it
        // can never be changed after release, so anything else publishes as a
        // brand-new listing instead of updating the existing one (10k+
        // installs). It is also the package FCM delivers to — google-services
        // matches on applicationId, and this package is registered in
        // google-services.json under project ppcpondy-9e33d.
        //
        // `namespace` above is intentionally left as com.ppcpondy.pondy_properties:
        // that is only the Kotlin/R class package (MainActivity.kt lives there)
        // and is independent of the applicationId Play and Firebase care about.
        applicationId = "com.apps.ppcpondy"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

// The backported java.time implementation that isCoreLibraryDesugaringEnabled
// above pulls in. flutter_local_notifications 18.x requires desugar_jdk_libs
// 2.1.4 or newer — an older version fails the same AAR metadata check.
dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
