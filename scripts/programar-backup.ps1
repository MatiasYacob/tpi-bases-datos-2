#requires -Version 5.1
[CmdletBinding()]
param([ValidatePattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')][string]$Hora='02:00', [switch]$SoloExportar, [ValidateSet('TPI-Tienda-Backup-Windows','TPI-Tienda-Backup-Windows-Prueba')][string]$NombreTarea='TPI-Tienda-Backup-Windows')
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'windows\common.ps1')
try {
    $root = Split-Path -Parent $PSScriptRoot
    $config = Join-Path $PSScriptRoot 'backup.config.yml'
    if (-not (Test-Path -LiteralPath $config)) { throw 'Preparar primero backup.config.yml.' }
    $null = Get-TpiTool 'mongodump' $root
    $null = Get-TpiTool 'bsondump' $root
    $shellPath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $scriptPath = Join-Path $PSScriptRoot 'backup.ps1'
    $action = New-ScheduledTaskAction -Execute $shellPath -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $scriptPath + '"') -WorkingDirectory $root
    $trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::ParseExact($Hora,'HH:mm',[Globalization.CultureInfo]::InvariantCulture))
    $principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Respaldo diario TPI. Requiere sesion iniciada, red y configuracion privada accesible.'
    $name = $NombreTarea
    if ($SoloExportar) {
        $file = Join-Path $root 'resguardos_tpi\tarea-windows.xml'
        New-Item -ItemType Directory -Path (Split-Path -Parent $file) -Force | Out-Null
        $task | Export-ScheduledTask | Set-Content -LiteralPath $file -Encoding Unicode
        Write-Host ('XML preparado sin registrar: ' + $file)
    } else {
        Register-ScheduledTask -TaskName $name -InputObject $task -Force | Out-Null
        Write-Host ('OK: tarea ' + $name + ' registrada a las ' + $Hora + '. Requiere sesion iniciada.')
    }
} catch { Write-Error $_.Exception.Message; exit 1 }
