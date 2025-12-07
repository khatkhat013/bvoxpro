# Fix paths in all HTML files
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"
$htmlFiles = Get-ChildItem -Path $basePath -Filter "*.html"

Write-Host "Found $($htmlFiles.Count) HTML files to process" -ForegroundColor Green

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $fileName = $file.BaseName
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    Write-Host "`nProcessing: $fileName"
    
    # 1. Replace .download extensions in script tags
    $content = $content -replace '\.download', ''
    
    # 2. Replace old image paths that use folder_files pattern with ./assets/img pattern
    $pattern = '\./[a-z0-9\-]+_files/'
    $replacement = './assets/img/'
    $content = $content -replace $pattern, $replacement
    
    # 3. Fix inline CSS background image paths
    $content = $content -replace 'background:\s*url\(/img/', 'background: url(./assets/img/'
    $content = $content -replace 'background-image:\s*url\(/img/', 'background-image: url(./assets/img/'
    
    # 4. Set CSS links appropriately based on file name
    # Record files use their specific CSS
    if ($fileName -match 'record$') {
        $cssFile = "./assets/css/$fileName.css"
        $content = $content -replace 'href="\.\/[a-z0-9\-]+_files\/style\.css"', "href=`"$cssFile`""
    }
    # AI files use their specific CSS
    elseif ($fileName -match '^ai-') {
        $cssFile = "./assets/css/$fileName.css"
        $content = $content -replace 'href="\.\/[a-z0-9\-]+_files\/style\.css"', "href=`"$cssFile`""
        $content = $content -replace 'href="\.\/assets\/css\/style\.css"', "href=`"$cssFile`""
    }
    # All other files use matching CSS
    else {
        $cssFile = "./assets/css/$fileName.css"
        $content = $content -replace 'href="\.\/assets\/css\/style\.css"', "href=`"$cssFile`""
        $content = $content -replace 'href="\.\/[a-z0-9\-]+_files\/style\.css"', "href=`"$cssFile`""
    }
    
    if ($originalContent -ne $content) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  Updated successfully"
    } else {
        Write-Host "  No changes needed"
    }
}

Write-Host "`nDone processing all files!" -ForegroundColor Green
