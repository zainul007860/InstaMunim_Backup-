$file = "src\app\dashboard\page.tsx"
$c = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# Fix 1: Add scroll to business category SelectContent
$c = $c.Replace(
  '<SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">',
  '<SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800 max-h-[300px] overflow-y-auto">'
)

# Fix 2: Add scannerTargetRef after qrCodeRef
$c = $c.Replace(
  '  const qrCodeRef = useRef<any>(null);' + "`r`n" + '  const lastScannedRef',
  '  const qrCodeRef = useRef<any>(null);' + "`r`n" + '  const scannerTargetRef = useRef<"cart" | "imei">("cart");' + "`r`n" + '  const lastScannedRef'
)

# Fix 3: Add IMEI routing at start of handleScanSuccess
$old3 = '  const handleScanSuccess = async (barcode: string, html5QrCodeInstance?: any) => {' + "`r`n" + '    playBeep();' + "`r`n" + '    setScannedBarcode(barcode);' + "`r`n" + '    ' + "`r`n" + '    const matchedItem'
$new3 = '  const handleScanSuccess = async (barcode: string, html5QrCodeInstance?: any) => {' + "`r`n" + '    playBeep();' + "`r`n" + '    setScannedBarcode(barcode);' + "`r`n" + '    if (scannerTargetRef.current === "imei") {' + "`r`n" + '      setImeiScanned(barcode);' + "`r`n" + '      const sc = html5QrCodeInstance || qrCodeRef.current;' + "`r`n" + '      if (sc) { try { await sc.stop(); } catch(e) {} }' + "`r`n" + '      qrCodeRef.current = null;' + "`r`n" + '      setShowScanner(false);' + "`r`n" + '      return;' + "`r`n" + '    }' + "`r`n" + '    const matchedItem'
$c = $c.Replace($old3, $new3)

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $c)
Write-Host "All 3 fixes applied."
