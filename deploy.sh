#!/bin/bash
set -e

# ---- config ----
REMOTE_USER="uli"
REMOTE_HOST="192.168.0.13"
REMOTE_PATH="/home/uli"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
BUILD_GRADLE="android/app/build.gradle"
APP_JSON="app.json"
# ----------------

# Always run from the repo root so the relative paths above resolve.
cd "$(dirname "$0")"

echo "==> Syncing version from package.json..."
# package.json is the single source of truth for the user-facing version:
# bump it there (e.g. `npm version patch --no-git-tag-version`) before deploying.
VERSION=$(node -p "require('./package.json').version")
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: package.json version \"$VERSION\" is not in X.Y.Z format"
  exit 1
fi

CURRENT_NAME=$(grep -oP 'versionName "\K[^"]+' "$BUILD_GRADLE")
sed -i "s/versionName \"$CURRENT_NAME\"/versionName \"$VERSION\"/" "$BUILD_GRADLE"
# Keep the Expo config in step so a future `expo prebuild` doesn't revert it.
sed -i -E "0,/\"version\": \"[^\"]*\"/s//\"version\": \"$VERSION\"/" "$APP_JSON"
echo "    versionName $CURRENT_NAME -> $VERSION"

echo "==> Bumping versionCode..."
# F-Droid only offers an APK as an update when its versionCode is higher
# than the installed one, so it is bumped on every run.
CURRENT_CODE=$(grep -oP 'versionCode \K[0-9]+' "$BUILD_GRADLE")
NEXT_CODE=$((CURRENT_CODE + 1))
sed -i "s/versionCode $CURRENT_CODE/versionCode $NEXT_CODE/" "$BUILD_GRADLE"
echo "    versionCode $CURRENT_CODE -> $NEXT_CODE"

if ! grep -q "versionName \"$VERSION\"" "$BUILD_GRADLE" || ! grep -q "\"version\": \"$VERSION\"" "$APP_JSON"; then
  echo "ERROR: failed to write version $VERSION into $BUILD_GRADLE / $APP_JSON"
  exit 1
fi

echo "==> Ensuring .env points at the release API..."
ENV_FILE=".env"
API_URL_LINE="EXPO_PUBLIC_API_URL=http://app.home.lab:8081/api"
touch "$ENV_FILE"
if grep -q '^EXPO_PUBLIC_API_URL=' "$ENV_FILE"; then
  sed -i "s|^EXPO_PUBLIC_API_URL=.*|$API_URL_LINE|" "$ENV_FILE"
else
  echo "$API_URL_LINE" >> "$ENV_FILE"
fi
echo "    $API_URL_LINE"

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

echo "==> Triggering remote fdroid update..."
echo "Go to server and run: cd /var/www/fdroid-repo && sudo fdroid update -c --pretty"

echo "==> Committing version bump..."
# Pathspecs limit the commit to the version files, leaving any other
# staged or unstaged work untouched.
git commit -m "chore: release v$VERSION (versionCode $NEXT_CODE)" -- "$BUILD_GRADLE" "$APP_JSON"

echo "==> Done. New version live at repo."
