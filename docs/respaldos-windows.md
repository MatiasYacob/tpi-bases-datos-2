# Respaldos y pruebas en Windows

Ejecutar los comandos en **PowerShell**, desde la carpeta del repositorio. No usar mongosh. No hace falta levantar el frontend ni el backend para el backup.

## Requisitos y configuración

- Node.js 24 y dependencias del backend instaladas (`npm ci` dentro de backend).
- Windows PowerShell 5.1 o PowerShell 7.
- MongoDB Database Tools: mongodump, mongorestore y bsondump en PATH, en `.tools/` dentro del repositorio o en la carpeta indicada por `TPI_TOOLS_BIN`.
- Configuración privada `scripts/backup.config.yml`, con `uri` de Atlas. Nunca compartir ni capturar esa URI.

Cada equipo debe instalar las herramientas y preparar su configuración privada. Si el backend tiene su `.env` configurado, ejecutar una sola vez:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configurar-backup.ps1 -DesdeBackend
```

El configurador restringe el archivo al usuario actual y SYSTEM. Se niega a sobrescribir una configuración existente.

## Backup manual

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

Crea `resguardos_tpi/AAAA-MM-DD/tpi_tienda/`, genera conteos desde los BSON y publica la marca `.completo` solamente si termina correctamente. Conserva hasta cinco fechas completas. Una copia válida del mismo día se conserva sin repetirla; `-Forzar` permite reemplazarla después de generar correctamente la nueva. Un fallo conserva la copia anterior. Las rutas se resuelven desde el script.

## Pruebas reproducibles y capturas

```powershell
cd backend
npm run evidence:windows
```

Esta prueba inicia y cierra su propio MongoDB temporal. Verifica once escenarios con herramientas reales: backup, omisión del mismo día, reemplazo, restauración, rechazo del destino ocupado, fallo sin perder la copia anterior, retención, pedidos inactivos, cero pedidos, conteos incorrectos y XML de la tarea. Las fechas antiguas se simulan para comprobar la retención. No usa Atlas. Guarda resultados y transcripciones en `docs/evidencias/windows/pruebas-locales.json`.

Para mostrar la evidencia real ya obtenida y tomar una captura de pantalla:

```powershell
cd ..
$e = Get-Content .\docs\evidencias\windows\atlas-restauracion.json -Raw | ConvertFrom-Json
$e.transcripcion
$e.comparacionPosteriorOrigen | ConvertTo-Json -Depth 6
```

Con la consola visible usar **Win + Shift + S**. La transcripción no incluye credenciales. No fotografiar `.env`, `backup.config.yml` ni la cadena de conexión.

## Restauración manual en un MongoDB local de prueba

El destino debe ser una instancia local propia y tener vacía la base `tpi_tienda_restore_test`. El script rechaza servidores remotos y bases de prueba ocupadas; no borra documentos para preparar el destino.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restaurar-prueba.ps1 -Fecha 2026-10-25 -UriLocal mongodb://127.0.0.1:27017/
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verificar-conteos.ps1 -Fecha 2026-10-25 -UriLocal mongodb://127.0.0.1:27017/
```

Adaptar fecha y puerto. No ejecutar este ejemplo sin disponer del MongoDB local de prueba. La restauración valida conteos, estados, historial y cálculos de todos los pedidos, incluidos los inactivos. El reporte mostrado por el restaurador por sí solo no compara Atlas.

## Programación diaria

Preparar el XML sin activar ninguna tarea:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\programar-backup.ps1 -SoloExportar
```

Para activar el respaldo diario a las 02:00:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\programar-backup.ps1 -Hora 02:00
```

La tarea se llama `TPI-Tienda-Backup-Windows`, requiere sesión iniciada y conexión de red, recupera ejecuciones omitidas cuando es posible y evita instancias simultáneas. Una copia ya completa del día se omite. No garantiza ejecución con la computadora apagada. Después de validar el XML, Matías registró una tarea de prueba y comprobó su ejecución automática a las 13:33 del 25/10/2026, con LastTaskResult=0. Luego retiró esa tarea. Esto no acredita un nuevo volcado, porque ya había copia válida del día, ni una tarea permanente activa. Captura original: docs/evidencias/windows/10-ejecucion-programada.png.

## Resultados reales del 25/10/2026

- Once escenarios locales aprobados en Windows PowerShell 5.1, Database Tools 100.19.1 y MongoDB temporal 7.0.24.
- Backup real de Atlas: 6 clientes, 12 productos y 9 pedidos.
- Restauración en otra instancia temporal propia: 27 documentos recuperados. Clientes: 3 activos/3 inactivos; productos: 9/3; pedidos: 6/3.
- Historial y cálculos de los nueve pedidos correctos. Conteos y reporte coinciden con una lectura posterior de Atlas.
- Recuperación y validación local de la captura de Matías: 0,535 segundos. No equivale al RTO de todo el servicio.
- Atlas se utilizó solamente como origen de lectura. No hubo pausa grupal de escrituras ni comparación campo por campo; no se afirma snapshot transaccional.

Evidencia detallada: `docs/evidencias/windows/atlas-restauracion.json`. El comando `npm run evidence:windows:atlas`, desde backend, reproduce la restauración temporal y comparación de lectura, utilizando la copia de la fecha actual y el `.env` local privado.
