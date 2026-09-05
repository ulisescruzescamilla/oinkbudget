#!/bin/bash
set -e

# ---- config ----
REMOTE_USER="uli"
REMOTE_HOST="192.168.0.13"
REMOTE_PATH="/home/uli"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
BUILD_GRADLE="android/app/build.gradle"
# ----------------

echo "==> Bumping versionCode..."
CURRENT_CODE=$(grep -oP 'versionCode \K[0-9]+' "$BUILD_GRADLE")
NEXT_CODE=$((CURRENT_CODE + 1))
sed -i "s/versionCode $CURRENT_CODE/versionCode $NEXT_CODE/" "$BUILD_GRADLE"
echo "    versionCode $CURRENT_CODE -> $NEXT_CODE"
echo "    (versionName is not auto-bumped — update it in $BUILD_GRADLE if this is a user-facing release)"

echo "==> Building release APK..."
cd android
# Gradle doesn't track .env files as bundle task inputs, so a plain
# assembleRelease can reuse a stale JS bundle after .env changes.
# `gradlew clean` is avoided here: it fails reconfiguring CMake against
# stale autolinking codegen paths (datetimepicker/gesture-handler/
# reanimated/worklets) that only get generated during assembleRelease.
# Removing the build dirs directly has the same effect without going
# through that broken clean task.
rm -rf app/build build app/.cxx
./gradlew assembleRelease
cd ..

if [ ! -f "$APK_PATH" ]; then
  echo "ERROR: APK not found at $APK_PATH"
  exit 1
fi

echo "==> Verifying signature..."
apksigner verify --print-certs "$APK_PATH"

echo "==> Uploading APK to $REMOTE_HOST..."
scp "$APK_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "==> Copying APK into fdroid repo..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cp ${REMOTE_PATH}/app-release.apk /var/www/fdroid-repo/repo/"

echo "==> Triggering remote fdroid update..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd /var/www/fdroid-repo && sudo fdroid update -c --pretty"

echo "==> Done. New version live at repo."
