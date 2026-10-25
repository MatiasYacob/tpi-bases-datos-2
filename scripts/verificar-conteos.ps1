#requires -Version 5.1
param([Parameter(Mandatory=$true)][string]$Fecha, [string]$UriLocal='mongodb://127.0.0.1:27017')
. (Join-Path $PSScriptRoot 'windows\common.ps1')
try {
    Assert-LocalUri $UriLocal
    if ($Fecha -notmatch '^\d{4}-\d{2}-\d{2}$') { throw 'Fecha invalida.' }
    $root = Join-Path (Split-Path -Parent $PSScriptRoot) 'resguardos_tpi'
    $copy = Assert-InTree (Join-Path $root $Fecha) $root
    if (-not (Test-TpiCopy $copy -Published)) { throw 'Copia incompleta.' }
    & node.exe (Join-Path $PSScriptRoot 'windows\mongo-check.mjs') 'verify' $UriLocal (Join-Path $copy 'conteos-esperados.json')
    exit $LASTEXITCODE
} catch { Write-TpiLog ('ERROR: ' + $_.Exception.Message); exit 1 }
