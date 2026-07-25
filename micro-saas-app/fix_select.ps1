$file = "src\app\dashboard\page.tsx"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)
$old = 'SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">'
$new = 'SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800 max-h-[320px] overflow-y-auto">'
$content2 = $content.Replace($old, $new)
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content2)
Write-Host "Done. Replacements made."
