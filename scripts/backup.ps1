#requires -Version 5.1
[CmdletBinding()]
param([switch]$Forzar)
. (Join-Path $PSScriptRoot 'windows\common.ps1')
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $projectRoot 'resguardos_tpi'
$config = Join-Path $PSScriptRoot 'backup.config.yml'
$destination = Join-Path $backupRoot (Get-Date -Format 'yyyy-MM-dd')
$temp = $null; $previous = $null; $lock = $null; $code = 0
try {
    Assert-NoLinks $backupRoot; Assert-NoLinks $config
    $dump = Get-TpiTool 'mongodump' $projectRoot
    $bsondump = Get-TpiTool 'bsondump' $projectRoot
    if (-not (Test-Path -LiteralPath $config -PathType Leaf)) { throw 'Falta scripts/backup.config.yml.' }
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
    # FileShare.None mantiene el bloqueo durante todo el proceso y se libera incluso al finalizar.
    try { $lock = [IO.File]::Open((Join-Path $backupRoot '.backup-windows.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch { throw 'Existe otro backup Windows en ejecucion.' }
    if (Test-Path -LiteralPath $destination) {
        if (-not (Test-TpiCopy $destination -Published)) { throw 'La copia del dia no es valida; no se reemplaza.' }
        if (-not $Forzar) { Write-TpiLog 'OMITIDO: copia completa del dia ya existente.'; return }
    }
    $temp = Assert-InTree (Join-Path $backupRoot ('.temporal.' + [guid]::NewGuid().ToString('N'))) $backupRoot
    New-Item -ItemType Directory -Path $temp | Out-Null
    Write-TpiLog 'Inicio de mongodump: tpi_tienda.'
    # PowerShell 5.1 trata stderr nativo como ErrorRecord aun con codigo 0.
    $ErrorActionPreference = 'Continue'
    try { & $dump ('--config=' + $config) '--db=tpi_tienda' ('--out=' + $temp) *> (Join-Path $temp 'herramienta.log'); $nativeCode = $LASTEXITCODE }
    finally { $ErrorActionPreference = 'Stop' }
    if ($nativeCode -ne 0) { throw 'mongodump fallo; copias anteriores conservadas.' }
    if (-not (Test-TpiCopy $temp)) { throw 'Faltan BSON o metadatos esperados.' }
    $counts = [ordered]@{}
    foreach ($name in @('clientes','productos','pedidos')) {
        $total = 0
        $ErrorActionPreference = 'Continue'
        try {
            & $bsondump '--quiet' '--objcheck' (Join-Path $temp ('tpi_tienda\' + $name + '.bson')) 2> (Join-Path $temp 'bson.log') | ForEach-Object { if ($_ -and $_.Trim()) { $total++ } }
            $nativeCode = $LASTEXITCODE
        } finally { $ErrorActionPreference = 'Stop' }
        if ($nativeCode -ne 0) { throw 'No se pudo validar y contar un BSON.' }
        $counts[$name] = $total
    }
    [IO.File]::WriteAllText((Join-Path $temp 'conteos-esperados.json'), ($counts | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText((Join-Path $temp '.completo'), (Get-Date).ToString('o'))
    # Los logs de herramientas pueden contener informacion de conexion: no se publican.
    Remove-Item -LiteralPath (Join-Path $temp 'herramienta.log'),(Join-Path $temp 'bson.log') -Force
    if (Test-Path -LiteralPath $destination) {
        $previous = Assert-InTree (Join-Path $backupRoot ('.anterior.' + [guid]::NewGuid().ToString('N'))) $backupRoot
        Assert-NoLinks $destination
        Move-Item -LiteralPath $destination -Destination $previous
    }
    Move-Item -LiteralPath $temp -Destination $destination
    $temp = $null
    if ($previous) { Remove-SafeDirectory $previous $backupRoot; $previous = $null }
    Write-TpiLog ('OK: respaldo publicado. Conteos: ' + ($counts | ConvertTo-Json -Compress))
    $copies = @(Get-ChildItem -LiteralPath $backupRoot -Directory | Where-Object {
        $parsed = [datetime]::MinValue
        $_.Name -match '^\d{4}-\d{2}-\d{2}$' -and [datetime]::TryParseExact($_.Name,'yyyy-MM-dd',[Globalization.CultureInfo]::InvariantCulture,[Globalization.DateTimeStyles]::None,[ref]$parsed) -and (Test-TpiCopy $_.FullName -Published)
    } | Sort-Object Name -Descending)
    foreach ($old in ($copies | Select-Object -Skip 5)) {
        Remove-SafeDirectory $old.FullName $backupRoot
        Write-TpiLog ('Retencion: retirada copia ' + $old.Name)
    }
    Write-TpiLog 'Fin. Se conservan hasta cinco fechas completas.'
} catch {
    # Mensajes propios; nunca imprimir la URI ni stderr de MongoDB.
    Write-TpiLog ('ERROR: ' + $_.Exception.Message); $code = 1
} finally {
    if ($previous -and (Test-Path -LiteralPath $previous) -and -not (Test-Path -LiteralPath $destination)) {
        Move-Item -LiteralPath $previous -Destination $destination
    }
    if ($temp -and (Test-Path -LiteralPath $temp)) { Remove-SafeDirectory $temp $backupRoot }
    if ($lock) { $lock.Dispose() }
}
exit $code
