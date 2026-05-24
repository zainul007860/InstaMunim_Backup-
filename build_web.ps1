$env:PATH += ";C:\Program Files\nodejs"
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = "." }
Set-Location "$ScriptDir\micro-saas-app"
npm run build
