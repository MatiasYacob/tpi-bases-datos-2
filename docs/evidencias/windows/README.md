# Evidencias Windows

## Ejecuciones registradas
- pruebas-locales.json: once escenarios con PowerShell y Database Tools sobre MongoDB temporal propio. No utiliza Atlas.
- atlas-restauracion.json: restauración de una copia existente de Atlas en otra instancia temporal y comparación posterior de conteos/reporte mediante lectura del origen.
- 01-pruebas-windows.png: ejecución de los once escenarios por Matías.
- 02-restauracion-windows.png: recuperación de 6 clientes, 12 productos y 9 pedidos; 0,535 s de recuperación local y comparación aprobada.
- 03-tests-backend.png: diez tests aprobados.
- 10-ejecucion-programada.png: tarea registrada para las 13:33; LastRunTime coincide y LastTaskResult=0. Matías retiró la tarea al terminar.

Las capturas corresponden a las ejecuciones aportadas por Matías. Los ensayos reproducibles regeneran los JSON con la fecha, puerto y tiempos de cada nueva ejecución. El campo tareaRegistrada=false del ensayo local significa que ese comando valida únicamente el XML; la captura por horario es una comprobación manual posterior e independiente.

Una copia completa de la fecha actual se omite si no se pide reemplazarla. El resultado de la tarea prueba la ejecución por horario, no un nuevo volcado ni una tarea diaria permanente activa. No se confirmó pausa de escrituras ni igualdad campo por campo. Los tiempos no representan el RTO del servicio completo.

## Reproducción
Desde backend: npm run evidence:windows. Requiere Windows PowerShell 5.1 y Database Tools en TPI_TOOLS_BIN, PATH o .tools/.

Para repetir la restauración y comparación de origen: npm run evidence:windows:atlas. Requiere backend/.env privado, una copia completa de la fecha actual y dependencias de desarrollo. El destino es una instancia temporal propia; Atlas se consulta únicamente en lectura. Antes, crear la copia desde la raíz con scripts/backup.ps1.
