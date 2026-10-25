# Funciones compartidas; no ejecuta backups al importarse.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Assert-InTree([string]$Path, [string]$Root) {
    $full = [IO.Path]::GetFullPath($Path)
    $boundary = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    if (-not $full.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta fuera del directorio permitido.' }
    return $full
}
function Assert-NoLinks([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'No se permiten enlaces o junctions en rutas de respaldo.' }
        }
        $parent = Split-Path -Parent $cursor
        if ($parent -eq $cursor) { break }; $cursor = $parent
    }
}
function Remove-SafeDirectory([string]$Path, [string]$Root) {
    $checked = Assert-InTree $Path $Root
    Assert-NoLinks $checked
    # Rechazar enlaces interiores antes de cualquier eliminacion recursiva.
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    $pending.Push($checked)
    while ($pending.Count) {
        foreach ($entry in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
            if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Enlace interior: no se elimina.' }
            if ($entry.PSIsContainer) { $pending.Push($entry.FullName) }
        }
    }
    Remove-Item -LiteralPath $checked -Recurse -Force
}
function Get-TpiTool([string]$Name, [string]$ProjectRoot) {
    if ($env:TPI_TOOLS_BIN) {
        $candidate = Join-Path $env:TPI_TOOLS_BIN ($Name + '.exe')
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    $command = Get-Command ($Name + '.exe') -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $private = Join-Path $ProjectRoot '.tools'
    if (Test-Path -LiteralPath $private) {
        $found = Get-ChildItem -LiteralPath $private -Filter ($Name + '.exe') -Recurse -File | Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    throw ('Falta ' + $Name + '. Instalar MongoDB Database Tools o definir TPI_TOOLS_BIN.')
}
function Test-TpiCopy([string]$Folder, [switch]$Published) {
    if (-not (Test-Path -LiteralPath $Folder -PathType Container)) { return $false }
    Assert-NoLinks $Folder
    foreach ($name in @('clientes','productos','pedidos')) {
        $bson = Join-Path $Folder ('tpi_tienda\' + $name + '.bson')
        $meta = Join-Path $Folder ('tpi_tienda\' + $name + '.metadata.json')
        if (-not (Test-Path -LiteralPath $bson -PathType Leaf) -or -not (Test-Path -LiteralPath $meta -PathType Leaf)) { return $false }
        Assert-NoLinks $bson; Assert-NoLinks $meta
        if ((Get-Item -LiteralPath $meta).Length -eq 0) { return $false }
    }
    if ($Published) {
        if (-not (Test-Path -LiteralPath (Join-Path $Folder '.completo'))) { return $false }
        $countPath = Join-Path $Folder 'conteos-esperados.json'
        Assert-NoLinks $countPath
        if (-not (Test-Path -LiteralPath $countPath -PathType Leaf)) { return $false }
        $counts = Get-Content -LiteralPath $countPath -Raw | ConvertFrom-Json
        foreach ($name in @('clientes','productos','pedidos')) {
            $value = $counts.$name
            if ($null -eq $value -or $value -is [string] -or $value -lt 0 -or $value -ne [math]::Truncate($value)) { return $false }
        }
    }
    return $true
}
function Write-TpiLog([string]$Message) { Write-Host ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $Message) }
function Assert-LocalUri([string]$Uri) {
    if ($Uri -notmatch '^mongodb://(127\.0\.0\.1|localhost):[0-9]{1,5}/?$') { throw 'La restauracion solo permite MongoDB local sin credenciales en la URI.' }
}
