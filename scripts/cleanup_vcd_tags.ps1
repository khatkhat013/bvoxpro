# Cleanup script to remove orphaned *_files/vcd* script tags from all HTML files

$repoRoot = "C:\Users\Black Coder\Downloads\bvoxfversion2-main"
$backupDir = Join-Path $repoRoot "download_backups" "html_before_vcd_cleanup"

# Create backup directory
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Find all HTML files
$htmlFiles = Get-ChildItem -Path $repoRoot -Filter "*.html" -File
$adminHtmlFiles = Get-ChildItem -Path (Join-Path $repoRoot "admin") -Filter "*.html" -File -ErrorAction SilentlyContinue
$allHtmlFiles = $htmlFiles + $adminHtmlFiles

Write-Host "Processing $($allHtmlFiles.Count) HTML files..." -ForegroundColor Cyan

$modifiedCount = 0

foreach ($file in $allHtmlFiles) {
    $relPath = $file.FullName -replace [regex]::Escape($repoRoot), ""
    $backupFile = Join-Path $backupDir $file.Name
    
    # Backup original
    Copy-Item -Path $file.FullName -Destination $backupFile -Force
    
    # Read content
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Remove orphaned vcd script tags
    $pattern = '<script[^>]+_files/vcd[a-f0-9]+[^>]*></script>'
    $matchCount = @([regex]::Matches($content, $pattern)).Count
    
    if ($matchCount -gt 0) {
        $newContent = $content -replace $pattern, ''
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "  $relPath - Removed $matchCount tag(s)" -ForegroundColor Green
        $modifiedCount++
    }
}

Write-Host "`nCleanup complete: Modified $modifiedCount files" -ForegroundColor Green
Write-Host "Running smoke-test..." -ForegroundColor Yellow

# Run smoke test
node "C:\Users\Black Coder\Downloads\bvoxfversion2-main\scripts\smoke_test_assets.js"
