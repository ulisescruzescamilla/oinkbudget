OinkBudget — App Icon Assets (Glifo)
=====================================
Brand violet: #7b4be0   ·   mark: white pig snout

iOS
---
ios/AppIcon.appiconset/  — drag the whole folder into your Xcode asset catalog
(Assets.xcassets). Contents.json is included; filenames use '-2x'/'-3x'.
Note: iOS icons are full-bleed squares (no transparency, no rounded corners).
The system applies the rounded mask automatically.

Android
-------
android/mipmap-*/        — copy each mipmap-<density> folder into app/src/main/res/
  ic_launcher.png             legacy launcher (square, system-masked)
  ic_launcher_round.png       legacy round launcher
  ic_launcher_foreground.png  adaptive icon foreground (snout, safe-zone padded)
  ic_launcher_background.png  adaptive icon background (solid violet)
android/mipmap-anydpi-v26/  — ic_launcher.xml + ic_launcher_round.xml (adaptive defs)
android/values/             — ic_launcher_background.xml (color resource)
android/play-store-icon-512.png — 512x512 high-res listing icon for Play Console

master/
-------
glifo-1024.png, glifo-512.png — source masters for any other size.
