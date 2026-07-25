# Read the file
$file = "src\app\dashboard\page.tsx"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# Find the Mobile/Electronics block - from "Mobile/Electronics": { to the next closing }
# We'll extract it and move it to second position (right after Restaurant/Cafe block)

# The Mobile/Electronics block starts at  "Mobile/Electronics": { and ends at the closing }
# and the whole Restaurant/Cafe block ends just before "Kirana/Grocery"

$mobileStart = '  "Mobile/Electronics": {'
$kiranaStart = '  "Kirana/Grocery": {'

$mobileIndex = $content.IndexOf($mobileStart)
$endMarker = '};' + [Environment]::NewLine  # end of BUSINESS_CATEGORIES

# Find end of Mobile/Electronics block (next top-level key or closing of object)
# It ends just before the closing }; of the whole BUSINESS_CATEGORIES
$closingIndex = $content.IndexOf("`r`n};" , $mobileIndex)
$mobileBlock = $content.Substring($mobileIndex, $closingIndex - $mobileIndex)

Write-Host "Mobile block starts at: $mobileIndex"
Write-Host "Mobile block preview: $($mobileBlock.Substring(0, [Math]::Min(100, $mobileBlock.Length)))"

# Remove the Mobile block from its current position
$contentWithout = $content.Remove($mobileIndex, $closingIndex - $mobileIndex)

# Find where Kirana starts in the modified content
$kiranaIndexNew = $contentWithout.IndexOf($kiranaStart)
Write-Host "Kirana index in modified: $kiranaIndexNew"

# Insert Mobile block before Kirana
$contentFinal = $contentWithout.Insert($kiranaIndexNew, $mobileBlock + "`r`n")

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $contentFinal)
Write-Host "Done! Mobile/Electronics moved to 2nd position."
