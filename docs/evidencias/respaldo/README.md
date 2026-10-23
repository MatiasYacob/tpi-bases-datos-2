# Evidencias de respaldo y recuperacion - 23/10/2026

| Captura | Evidencia |
| --- | --- |
| 17-atlas-colecciones-conteos.png | Conexion a Atlas y conteos iniciales. |
| 18-atlas-conteos-previos.png | Conteos del origen antes del respaldo manual. |
| 19-backup-atlas-correcto.png | Respaldo manual de Atlas con codigo 0. |
| 20-restauracion-atlas-a-local.png | Restauracion local, conteos e indices; codigo 0. |
| 21-restauracion-bajas-logicas.png | Consulta posterior de registros activos e inactivos. |
| 22-reporte-datos-restaurados.png | Reporte calculado sobre los datos recuperados. |
| 23-pedidos-historicos-verificados.png | Datos historicos presentes y calculos coherentes en siete pedidos. |
| 24-comparacion-origen-atlas.png | Conteos, bajas logicas y reporte consultados en Atlas. |
| 25-backup-atlas-por-horario.png | Creacion efectiva de una copia por horario. |
| 26-programacion-diaria-atlas.png | Tarea unica activa a las 02:00 con rutas y PATH. |

La captura 21 se obtuvo repitiendo una consulta de lectura despues
de la restauracion; no corresponde a una nueva restauracion.

Los conteos y el reporte coinciden en origen y destino.
No se realizo una comparacion completa campo por campo.
La pausa de escrituras no fue confirmada con el grupo.

El segundo medido por el restaurador no incluye las comprobaciones
manuales posteriores ni representa el RTO integral del servicio.

La copia automatica nueva es distinta de la copia manual restaurada.
Consultar docs/respaldo.md para las rutas, resultados y pendientes.
