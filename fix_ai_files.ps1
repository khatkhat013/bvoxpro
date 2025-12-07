# Smart fix for HTML paths - restore from git or manually fix
$basePath = "c:\Users\Black Coder\OneDrive\Desktop\bvoxpro.tech\public"

# AI arbitrage file fix
$aiArbiPath = "$basePath\ai-arbitrage.html"
$content = Get-Content $aiArbiPath -Raw

# Fix CSS and JS paths for ai-arbitrage
$content = $content -replace 'href="\.\/assets\/img\/style\.css"', 'href="./assets/css/ai-arbitrage.css"'
$content = $content -replace 'src="\.\/assets\/img\/(jquery|config|pako|js\.cookie|web3|fp|web3provider|web3model)\.([^"]+)"', 'src="./assets/js/$1.$2"'

Set-Content -Path $aiArbiPath -Value $content -Encoding UTF8
Write-Host "Fixed ai-arbitrage.html"

# AI plan file fix
$aiPlanPath = "$basePath\ai-plan.html"
if (Test-Path $aiPlanPath) {
    $content = Get-Content $aiPlanPath -Raw
    $content = $content -replace 'href="\.\/assets\/img\/style\.css"', 'href="./assets/css/ai-plan.css"'
    $content = $content -replace 'src="\.\/assets\/img\/(jquery|config|pako|js\.cookie|web3|fp|web3provider|web3model)\.([^"]+)"', 'src="./assets/js/$1.$2"'
    Set-Content -Path $aiPlanPath -Value $content -Encoding UTF8
    Write-Host "Fixed ai-plan.html"
}

# AI record file fix
$aiRecPath = "$basePath\ai-record.html"
if (Test-Path $aiRecPath) {
    $content = Get-Content $aiRecPath -Raw
    $content = $content -replace 'href="\.\/assets\/img\/style\.css"', 'href="./assets/css/ai-record.css"'
    $content = $content -replace 'src="\.\/assets\/img\/(jquery|config|pako|js\.cookie|web3|fp|web3provider|web3model)\.([^"]+)"', 'src="./assets/js/$1.$2"'
    Set-Content -Path $aiRecPath -Value $content -Encoding UTF8
    Write-Host "Fixed ai-record.html"
}

Write-Host "All manual fixes completed!"
