#requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Fecha, [string]$UriLocal = 'mongodb://127.0.0.1:27017')
. (Join-Path $PSScriptRoot 'windows\common.ps1')
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $projectRoot 'resguardos_tpi'
$restoreLog = $null
try {
    Assert-LocalUri $UriLocal
    $dateValue = [datetime]::MinValue
    if (-not [datetime]::TryParseExact($Fecha,'yyyy-MM-dd',[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::None,[ref]$dateValue)) { throw 'Fecha invalida; usar AAAA-MM-DD.' }
    $copy = Assert-InTree (Join-Path $backupRoot $Fecha) $backupRoot
    if (-not (Test-TpiCopy $copy -Published)) { throw 'La copia no tiene archivos y conteos completos.' }
    $tool = Get-TpiTool 'mongorestore' $projectRoot
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $helper = Join-Path $PSScriptRoot 'windows\mongo-check.mjs'
    & $node $helper 'empty' $UriLocal
    if ($LASTEXITCODE -ne 0) { throw 'Destino no disponible o contiene colecciones; no se reemplaza.' }
    $watch = [Diagnostics.Stopwatch]::StartNew()
    Write-TpiLog 'Inicio restauracion en tpi_tienda_restore_test LOCAL.'
    $restoreLog = Join-Path $backupRoot ('.restore.' + [guid]::NewGuid().ToString('N') + '.log')
    $ErrorActionPreference = 'Continue'
    try {
        & $tool ('--uri=' + $UriLocal) '--stopOnError' '--nsInclude=tpi_tienda.*' '--nsFrom=tpi_tienda.*' '--nsTo=tpi_tienda_restore_test.*' $copy *> $restoreLog
        $nativeCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = 'Stop' }
    if ($nativeCode -ne 0) { throw 'mongorestore fallo. No se borra el destino; revisar antes de reintentar.' }
    & $node $helper 'verify' $UriLocal (Join-Path $copy 'conteos-esperados.json')
    if ($LASTEXITCODE -ne 0) { throw 'La verificacion de los datos recuperados fallo.' }
    $watch.Stop()
    Write-TpiLog ('OK: recuperacion local validada en ' + $watch.Elapsed.TotalSeconds.ToString('F3',[Globalization.CultureInfo]::InvariantCulture) + ' segundos.')
    Write-TpiLog 'Este tiempo no incluye levantar la aplicacion.'
} catch { Write-TpiLog ('ERROR: ' + $_.Exception.Message); exit 1 }
finally { if ($restoreLog -and (Test-Path -LiteralPath $restoreLog)) { Remove-Item -LiteralPath $restoreLog -Force } }
