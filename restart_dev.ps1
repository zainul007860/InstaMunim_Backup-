$env:PATH += ";C:\Program Files\nodejs"
Set-Location "C:\Users\Admin\.gemini\antigravity\scratch\micro-saas-app"
echo "Cleaning .next cache..."
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
echo "Starting Dev Server..."
npm run dev
