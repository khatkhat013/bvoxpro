# Fix CSS links for all files to use matching filename
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"

$replacements = @(
    @{ file = "topup.html"; css = "topup.css" },
    @{ file = "topup-record.html"; css = "topup-record.css" },
    @{ file = "service.html"; css = "service.css" },
    @{ file = "send-record.html"; css = "send-record.css" },
    @{ file = "out.html"; css = "out.css" },
    @{ file = "mining-record.html"; css = "mining-record.css" },
    @{ file = "loan.html"; css = "loan.css" },
    @{ file = "loan-record.html"; css = "loan-record.css" },
    @{ file = "license.html"; css = "license.css" },
    @{ file = "lang.html"; css = "lang.css" },
    @{ file = "kyc2.html"; css = "kyc2.css" },
    @{ file = "kyc1.html"; css = "kyc1.css" },
    @{ file = "identity.html"; css = "identity.css" },
    @{ file = "financial.html"; css = "financial.css" },
    @{ file = "faqs.html"; css = "faqs.css" },
    @{ file = "exchange.html"; css = "exchange.css" },
    @{ file = "exchange-record.html"; css = "exchange-record.css" },
    @{ file = "contract.html"; css = "contract.css" },
    @{ file = "contract-record.html"; css = "contract-record.css" },
    @{ file = "assets.html"; css = "assets.css" }
)

Write-Host "Updating CSS links to match filename..." -ForegroundColor Green

foreach ($item in $replacements) {
    $filePath = "$basePath\$($item.file)"
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $content = $content -replace 'href="\.\/assets\/css\/style\.css"', "href=`"./assets/css/$($item.css)`""
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  Updated: $($item.file) -> $($item.css)"
    }
}

Write-Host "`nDone updating CSS links!" -ForegroundColor Green
