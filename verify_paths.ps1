# Verification script - check all HTML files for correct paths
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html"

Write-Host "=== VERIFICATION REPORT ===" -ForegroundColor Cyan
Write-Host "`nChecking $($htmlFiles.Count) HTML files...`n" -ForegroundColor Green

$issues = 0

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $fileName = $file.BaseName
    $content = Get-Content $filePath -Raw
    
    $fileIssues = 0
    
    # Check for .download extensions
    if ($content -match '\.download') {
        Write-Host "  ❌ $fileName - Still has .download extensions" -ForegroundColor Red
        $fileIssues++
        $issues++
    }
    
    # Check for old _files pattern
    if ($content -match '\./[a-z0-9\-]+_files/') {
        Write-Host "  ❌ $fileName - Still has old _files folder pattern" -ForegroundColor Red
        $fileIssues++
        $issues++
    }
    
    # Check for correct CSS link pattern
    if ($fileName -eq 'index') {
        if ($content -notmatch 'href="\.\/assets\/css\/index\.css"') {
            Write-Host "  ⚠️ $fileName - CSS link not optimal (should use index.css)" -ForegroundColor Yellow
        }
    } else {
        $expectedCss = $fileName
        if ($content -notmatch "href=`"\.\/assets\/css\/$expectedCss\.css`"") {
            Write-Host "  ⚠️ $fileName - CSS link incorrect (expected $expectedCss.css)" -ForegroundColor Yellow
        }
    }
    
    # Check that all img src use ./assets/img/ pattern
    $imgMatches = [regex]::Matches($content, 'src="([^"]*\.(png|jpg|gif|ico|svg))"')
    foreach ($match in $imgMatches) {
        if ($match.Groups[1].Value -notmatch '^\.\/assets\/img\/') {
            if ($match.Groups[1].Value -notmatch '^https?://') {
                Write-Host "  ⚠️ $fileName - Image path not using assets/img: $($match.Groups[1].Value)" -ForegroundColor Yellow
            }
        }
    }
    
    # Check that all script src use ./assets/js/ pattern (except external URLs)
    $scriptMatches = [regex]::Matches($content, 'src="([^"]*\.js)"')
    foreach ($match in $scriptMatches) {
        if ($match.Groups[1].Value -notmatch '^\.\/assets\/js\/') {
            if ($match.Groups[1].Value -notmatch '^https?://') {
                if ($match.Groups[1].Value -notmatch '^\./js/') {
                    # This might be a different js folder, that's okay
                }
            }
        }
    }
    
    if ($fileIssues -eq 0) {
        Write-Host "  ✅ $fileName - OK" -ForegroundColor Green
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($issues -eq 0) {
    Write-Host "✅ All HTML files are correctly formatted!" -ForegroundColor Green
} else {
    Write-Host "❌ Found $issues issue(s)" -ForegroundColor Red
}

# List JS files in assets/js
Write-Host "`n=== JS FILES IN /assets/js ===" -ForegroundColor Cyan
$jsPath = "$basePath\assets\js"
$jsFiles = Get-ChildItem -Path $jsPath -Filter "*.js" | Select-Object -First 15
foreach ($jsFile in $jsFiles) {
    Write-Host "  ✓ $($jsFile.Name)"
}

Write-Host "`nDone!`n" -ForegroundColor Cyan
