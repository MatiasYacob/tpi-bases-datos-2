# Configura solamente el archivo local .env; no modifica Atlas.
$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    throw 'Ya existe .env. Conservarlo y revisar su configuracion manualmente.'
}
$securePassword = Read-Host 'Contrasena de tpi_app en Atlas (entrada oculta)' -AsSecureString
$passwordPointer = [IntPtr]::Zero
try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    if ([string]::IsNullOrWhiteSpace($plainPassword)) { throw 'La contrasena no puede estar vacia.' }
    $encodedPassword = [Uri]::EscapeDataString($plainPassword)
    $configLines = @(
        'PORT=3000'
        'HOST=127.0.0.1'
        "MONGODB_URI=mongodb+srv://tpi_app:$encodedPassword@tpi-tienda.h0wuken.mongodb.net/?retryWrites=true&w=majority&appName=TPI-Tienda"
        'MONGODB_DB=tpi_tienda'
        'FRONTEND_ORIGIN=http://localhost:5173'
    )
    [IO.File]::WriteAllLines($envPath, $configLines, [Text.UTF8Encoding]::new($false))
    Write-Host 'Configuracion local guardada. No compartir ni subir .env a Git.'
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    $plainPassword = $null
    $encodedPassword = $null
    $configLines = $null
    $securePassword.Dispose()
}
