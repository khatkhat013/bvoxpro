# Safe cleanup script for *.download artifacts
# - Backups every .download file under download_backups/ preserving folder structure
# - If canonical (no .download) file exists, delete the .download (it's a duplicate)
# - If canonical file does NOT exist, rename the .download to the canonical filename
# Run from project root:
# PowerShell (as normal user):
#   powershell -ExecutionPolicy Bypass -File .\scripts\cleanup_downloads.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path -Path "$(Split-Path -Parent $PSCommandPath)\.." | Select-Object -ExpandProperty Path
if (-not $repoRoot) { $repoRoot = Get-Location }
$repoRoot = (Get-Item -Path $repoRoot).FullName
Write-Output "Repo root: $repoRoot"

$backupRoot = Join-Path $repoRoot 'download_backups'
if (-not (Test-Path -Path $backupRoot)) { New-Item -Path $backupRoot -ItemType Directory | Out-Null }

# Collect all .download files
$downloadFiles = Get-ChildItem -Path $repoRoot -Recurse -Filter '*.download' -File -ErrorAction SilentlyContinue
Write-Output "Found $($downloadFiles.Count) .download files. Backing up and processing..."

foreach ($f in $downloadFiles) {
    try {
        $fullPath = $f.FullName
        # Build backup path preserving relative layout
        $relative = $fullPath.Substring($repoRoot.Length).TrimStart('\', '/')
        $backupPath = Join-Path $backupRoot $relative
        $backupDir = Split-Path -Path $backupPath -Parent
        if (-not (Test-Path -Path $backupDir)) { New-Item -Path $backupDir -ItemType Directory -Force | Out-Null }

        # Copy to backup location (overwrite if present)
        Copy-Item -Path $fullPath -Destination $backupPath -Force

        # Determine canonical path (strip .download suffix)
        if ($fullPath -match '\.download$') {
            $canonical = $fullPath.Substring(0, $fullPath.Length - 9) # remove '.download'
        } else {
            $canonical = $fullPath + '.orig'
        }

        if (Test-Path -Path $canonical) {
            # Canonical exists -> remove the .download duplicate
            Remove-Item -Path $fullPath -Force
            Write-Output "Deleted duplicate (canonical exists): $relative"
        } else {
            # Canonical missing -> rename .download => canonical
            Move-Item -Path $fullPath -Destination $canonical -Force
            Write-Output "Renamed: $relative -> " + (Resolve-Path -Path $canonical)
        }
    } catch {
        Write-Warning "Failed processing $($f.FullName): $_"
    }
}

Write-Output "Cleanup complete. Backups saved under: $backupRoot"
Write-Output "Next: run a quick site test (hard-refresh) and check DevTools Network for 404s."
