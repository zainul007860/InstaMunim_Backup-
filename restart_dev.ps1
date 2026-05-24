$env:PATH += ";C:\Program Files\nodejs"
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = "." }
Set-Location "$ScriptDir\micro-saas-app"
echo "Cleaning .next cache..."
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
echo "Starting Dev Server..."
npm run dev
