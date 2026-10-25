# Estado del proyecto

## Aplicación
- Backend Express conectado con MongoDB Atlas y frontend React integrado.
- Clientes, productos y pedidos con validadores, índices y baja lógica.
- Pedidos con instantáneas históricas, transiciones de estado y reporte por categoría.
- Revisión cruzada de Javier registrada: aprobada con observaciones.

## Pruebas técnicas
- npm test: 10 pruebas de API y regresiones del restaurador.
- evidence:integration: 48 solicitudes HTTP y 4 comprobaciones MongoDB.
- evidence:indexes: tres consultas con menor cantidad de documentos examinados y un control que conserva SORT.
- Los ensayos automáticos utilizan MongoDB temporal; las pruebas de Atlas están identificadas por separado.

## Respaldos
- Scripts macOS de Brenda: backup, retención, automatización launchd y restauración local comprobados. Detalle en docs/respaldo.md.
- Scripts Windows: backup, conteos BSON, reemplazo seguro, retención de cinco fechas y restauración local.
- Once escenarios Windows aprobados con herramientas reales, incluidos fallo sin perder la copia anterior, destino ocupado, pedidos inactivos y cero pedidos.
- Copia Atlas restaurada en MongoDB temporal: 6 clientes, 12 productos y 9 pedidos. Conteos y reporte coincidieron con una lectura posterior del origen.
- Captura de Matías: recuperación local validada en 0,535 s. No representa RTO del servicio completo.
- Tarea Windows de prueba ejecutada por horario a las 13:33 con resultado 0; luego retirada. Una copia válida del mismo día se omite: la prueba no acredita un nuevo volcado ni una tarea permanente Windows activa.
- Guía y evidencias: docs/respaldos-windows.md y docs/evidencias/windows/.

## Límites conocidos
- Agregados monetarios extraordinariamente grandes pueden exceder el entero seguro de JavaScript.
- No se garantiza una instantánea global entre lecturas de catálogo y creación del pedido.
- No se confirmó pausa grupal de escrituras para los respaldos ni igualdad campo por campo.
- No se ensayaron apagado, suspensión o recuperación de horarios omitidos.
- La revisión funcional no cubrió móvil, navegación solo con teclado ni Reintentar carga.

## Material de entrega
El PDF, la carpeta de entrega y sus correcciones editoriales se gestionan por separado. No forman parte de esta actualización técnica. El acceso de corrección y los paquetes que contengan credenciales quedan fuera del repositorio público.
