$env:PATH += ";C:\Program Files\nodejs"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = "." }
Set-Location "$ScriptDir\micro-saas-app"

echo "[0/4] Cleaning old APK copies from assets..."
Remove-Item -Path "public/app-debug.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "out/app-debug.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "android/app/src/main/assets/public/app-debug.apk" -ErrorAction SilentlyContinue

echo "[1/4] Building Next.js Web Assets..."
npm run build

echo "[2/4] Syncing Assets to Android..."
npx cap sync

echo "[3/4] Building Final Debug APK..."
Set-Location "android"
./gradlew clean assembleDebug

echo "[4/4] Copying Output APKs..."
Copy-Item -Path "app/build/outputs/apk/debug/app-debug.apk" -Destination "../../app-v1.2-final.apk" -Force

echo "[DONE] Build and Sync Complete."
