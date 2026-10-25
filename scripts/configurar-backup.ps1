#requires -Version 5.1
param([switch]$DesdeBackend)
$ErrorActionPreference='Stop'
try {
    if (-not $DesdeBackend) { throw 'Usar -DesdeBackend para reutilizar la conexion privada existente.' }
    $config = Join-Path $PSScriptRoot 'backup.config.yml'
    if (Test-Path -LiteralPath $config) { throw 'La configuracion ya existe; no se sobrescribe.' }
    New-Item -ItemType File -Path $config | Out-Null
    $acl = Get-Acl -LiteralPath $config
    $acl.SetAccessRuleProtection($true,$false)
    $userSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($userSid,'FullControl','Allow')
    $acl.SetAccessRule($rule)
    $systemRule = New-Object Security.AccessControl.FileSystemAccessRule('SYSTEM','FullControl','Allow')
    $acl.SetAccessRule($systemRule)
    Set-Acl -LiteralPath $config -AclObject $acl
    & node.exe (Join-Path $PSScriptRoot 'windows\configurar-backup.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Configuracion no completada; revisar archivo local.' }
    Write-Host 'Permisos: solo usuario actual y SYSTEM. No subir backup.config.yml a Git.'
} catch { Write-Error $_.Exception.Message; exit 1 }
