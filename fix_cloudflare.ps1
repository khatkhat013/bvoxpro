# Fix Cloudflare script references in all HTML files
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html"

$cfScriptOld = '<script defer="" src="./assets/img/vcd15cbe7772f49c399c6a5babf22c1241717689176015"'
$cfScriptNew = '<!-- Cloudflare Analytics - commented out for local development -->'

Write-Host "Fixing Cloudflare script references in all HTML files..." -ForegroundColor Green

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $content = Get-Content $filePath -Raw
    
    if ($content -contains $cfScriptOld) {
        # Replace the entire Cloudflare script block with commented version
        $content = $content -replace 'integrity="[^"]*" data-cf-beacon="[^"]*" crossorigin="anonymous"><\/script>', ''
        $content = $content -replace '<script defer="" src="\./assets/img/vcd15cbe7772f49c399c6a5babf22c1241717689176015"[^>]*>.*?<\/script>', $cfScriptNew
        
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  Fixed: $($file.Name)"
    }
}

Write-Host "`nDone fixing Cloudflare references!" -ForegroundColor Green
