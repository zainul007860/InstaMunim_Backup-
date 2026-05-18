$env:PATH += ";C:\Program Files\nodejs"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Set-Location "C:\Users\Admin\.gemini\antigravity\scratch\micro-saas-app"

echo "[1/2] Syncing Web Assets to Android..."
npx cap sync

echo "[2/2] Building Final APK with JBR..."
Set-Location "android"
./gradlew clean assembleDebug
