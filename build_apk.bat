@echo off
echo [1/4] Setting Environment...
set PATH=%PATH%;C:\Program Files\nodejs
cd C:\Users\Admin\.gemini\antigravity\scratch\micro-saas-app

echo [2/4] Cleaning and Building Web App...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out
call npm run build

echo [3/4] Syncing with Capacitor...
call npx cap sync

echo [4/4] Fresh APK Build (Gradle Clean)...
cd android
call gradlew clean assembleDebug

echo [FINISH] Fresh Updated APK Build Complete.
