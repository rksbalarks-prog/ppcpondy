# Chatbot voice/mic inside the Android WebView app

The AI assistant's voice mode calls `navigator.mediaDevices.getUserMedia({audio:true})`.

- In a **mobile browser** (Chrome, etc.) over HTTPS this prompts for mic automatically.
  The web app also requests it up-front on the mic tap and shows a "please allow mic"
  message if blocked (see `useVoice.js` → `ensureMic`, `AssistantWidget.jsx` → `startVoiceMode`).
- Inside the **installed WebView wrapper app** (`com.apps.rentpondy`, source NOT in this repo),
  the Android WebView **blocks** `getUserMedia` until the **native app grants it**. No website
  JavaScript can override this. The three changes below are required in that app, then rebuild
  + Play Store update.

Requirements that are already satisfied: the site is served over HTTPS, and Android System
WebView is Chromium (getUserMedia supported on API 21+ when `onPermissionRequest` is handled).

---

## 1. AndroidManifest.xml — add permissions
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<!-- INTERNET is already present -->
```

## 2. Grant the WebView's mic request + allow media  (THE MISSING PIECE)

### Java
```java
WebSettings ws = webView.getSettings();
ws.setJavaScriptEnabled(true);
ws.setDomStorageEnabled(true);
ws.setMediaPlaybackRequiresUserGesture(false); // lets getUserMedia + voice TTS run

webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> {
            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.getResources());       // grant the mic to the page
            } else {
                request.deny();
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{ Manifest.permission.RECORD_AUDIO }, 1001);
            }
        });
    }
});
```

### Kotlin
```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    mediaPlaybackRequiresUserGesture = false
}

webView.webChromeClient = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest) {
        runOnUiThread {
            if (ContextCompat.checkSelfPermission(this@MainActivity,
                    Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.resources)
            } else {
                request.deny()
                ActivityCompat.requestPermissions(this@MainActivity,
                    arrayOf(Manifest.permission.RECORD_AUDIO), 1001)
            }
        }
    }
}
```

## 3. Request the OS runtime permission once (Android 6+)

### Java (in onCreate)
```java
if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
            new String[]{ Manifest.permission.RECORD_AUDIO }, 1001);
}
```

### Kotlin (in onCreate)
```kotlin
if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
        != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 1001)
}
```

---

## If the chatbot is ever embedded in the Flutter app (rentpondy_flutter, webview_flutter)
1. Add `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` to `android/app/src/main/AndroidManifest.xml`.
2. On the `AndroidWebViewController`, set an `onPlatformPermissionRequest` handler that calls
   `request.grant()` for audio, and request the runtime `Permission.microphone` (permission_handler).
   webview_flutter's Android platform supports this via `PlatformWebViewControllerCreationParams`.
