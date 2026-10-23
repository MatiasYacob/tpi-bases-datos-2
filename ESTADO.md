# Estado del proyecto
Actualizado el 23 de octubre de 2026.

## Integrado en main
- Backend Express y driver oficial MongoDB: CRUD, baja logica, validaciones,
  instantaneas historicas, transiciones de pedidos y reporte por categoria.
- Atlas configurado: proyecto TPI-BD2, cluster TPI-Tienda y base tpi_tienda.
  Conexion real y visualizacion en Compass comprobadas durante la implementacion.
- Frontend React conectado a la API, con persistencia, espera y errores.
- Validadores BSON, indices y seed repetible sin borrado de datos existentes.
- Scripts Bash de respaldo/restauracion de Brenda: PR #3, merge 81857bc.
- Evidencias de indices e integracion: PR #4, merge a6dd1cc.
- Correccion del falso fallo de restauracion: PR #5, merge 621406f.
  Ahora compara conteos primero, acepta pedidos inactivos y cero pedidos.

## Validaciones realizadas
- npm test: 10 pruebas aprobadas el 23/10/2026.
  Cuatro pruebas API/MongoDB temporal y seis regresiones de restauracion
  que ejecutan las expresiones mongosh con respuestas de DB simuladas.
- Sintaxis Bash del restaurador corregido validada.
- evidence:integration: 48 solicitudes HTTP y 4 comprobaciones MongoDB aprobadas.
- evidence:indexes: MongoDB temporal 7.0.24, 100 clientes, 10000 productos
  y 20000 pedidos ficticios. Tres consultas pasan de 10000/20000/20000
  documentos examinados a 10/10/10, con mismos resultados y orden.
- Control de productos sin categoria: recorre 9000 claves y mantiene SORT.
- Frontend: compilacion aprobada y flujos reales comprobados anteriormente.
- Estas evidencias locales no equivalen a benchmark de Atlas ni a restauracion real.

## Documentacion de entrega
- Contrato ampliado: docs/contrato-api.md, con entradas, filtros, errores
  y ejemplos JSON reales de la ejecucion temporal.
- Pruebas y respuestas: docs/pruebas-integracion.md y docs/evidencias/integracion/.
- Planes y metricas: docs/evidencias/indices/.
- Informe de revision: output/pdf/informe-tpi-bd2.pdf (7 paginas).
- Fuente editable: docs/informe-tpi.md; generador: docs/generar-informe.py.
- Guia independiente para Javier: docs/revision-cruzada.md.
- Pendientes por integrante: output/pdf/pendientes-javier.pdf y pendientes-brenda.pdf.
- Generador de pendientes: docs/generar-pendientes.py.
- Los PDFs distinguen pruebas realizadas y pendientes; no son una entrega final aprobada.

## Pendiente de confirmacion y cierre
1. Javier: ejecutar revision independiente, registrar observaciones y veredicto.
2. Brenda: actualizar su copia de ejecucion con el restaurador corregido
   y repetir la restauracion real en macOS.
3. Brenda: publicar evidencia de respaldo desde Atlas, validaciones de negocio,
   RTO y estado efectivo de la tarea diaria. Lo ultimo documentado la deja pausada.
   Si ya se completo en su equipo, falta actualizar los resultados publicados.
4. Asociar conteos-esperados.json correctos a cada respaldo; hoy se prepara manualmente.
5. Incorporar evidencia final de Brenda y revision de Javier al informe.
6. Preparar ZIP final sin secretos, dependencias ni respaldos y ensayar defensa.
7. Limitacion conocida de baja prioridad: controlar desborde de enteros seguros
   al agregar importes extraordinariamente grandes en el reporte.

## Resguardo
.env reales, configuracion privada y volcados excluidos de Git.
La correccion del restaurador no ejecuto mongorestore ni modifico Atlas.
