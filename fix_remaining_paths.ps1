# Fix remaining incorrect paths in HTML files
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html"

Write-Host "Fixing incorrect CSS and JS paths..." -ForegroundColor Green

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $fileName = $file.BaseName
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Fix CSS files that were incorrectly placed in ./assets/img/
    $content = $content -replace 'src="\.\/assets\/img\/(style|jquery|config|pako|js\.cookie|web3|fp|web3provider|web3model|axios|kline)\.([^"]+)"', 'src="./assets/js/$1.$2"'
    $content = $content -replace 'href="\.\/assets\/img\/(style|mining|contract|exchange|ai-arbitrage|ai-plan|ai-record|assets|loan|kyc1|kyc2|identity|financial|out|service|license|faqs|lang|kline)\.css"', 'href="./assets/css/$1.css"'
    
    if ($originalContent -ne $content) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  Updated: $fileName"
    }
}

Write-Host "`nDone fixing paths!" -ForegroundColor Green
