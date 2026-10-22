# Estado del proyecto
Actualizado el 22 de octubre de 2026. Rama de trabajo: matias/evidencia-indices.

## Implementado y verificado
- Backend Express con driver oficial MongoDB: CRUD, baja logica, validaciones,
  instantaneas historicas de pedidos, transiciones de estado y reporte.
- Validadores BSON, indices y seed repetible sin borrar datos existentes.
- Atlas: proyecto TPI-BD2, cluster gratuito TPI-Tienda, base tpi_tienda.
  Usuario y acceso de red configurados; conexion real comprobada.
- Frontend conectado a la API: formularios asincronos, manejo de errores,
  persistencia al recargar y reporte consultado al servidor.
- Backend: 4 pruebas de integracion aprobadas con MongoDB temporal.
- Frontend: build aprobado y flujos reales verificados en navegador.
- Verificados email duplicado, alta/edicion/baja, pedidos, reporte y recuperacion
  despues de detener y reiniciar backend.
- Datos ficticios de verificacion dados de baja logica.
  Activos al finalizar: 2 clientes, 8 productos y 5 pedidos.
- Compass conectado y visualizacion confirmada por Matias.
- .env reales y dependencias excluidos de Git.

## Proximos pasos
- Revisar y publicar la nueva evidencia de indices cuando Matias lo indique.
- Coordinar con Brenda los pendientes registrados en docs/respaldo.md.
- Revision cruzada de las pruebas documentadas en docs/pruebas-integracion.md.
- Completar evidencia y documentacion de entrega.

## Evidencia de indices - 22/10/2026
- Main actualizado con la integracion de Brenda antes de iniciar esta rama.
- Script reproducible: backend/src/scripts/evidence-indexes.js.
- Comando: npm run evidence:indexes desde backend, sin Atlas ni .env.
- MongoDB temporal 7.0.24; 100 clientes, 10000 productos, 20000 pedidos ficticios.
- Antes: solo _id_. Despues: indices del proyecto; sin hint.
- Tres consultas: documentos examinados 10000/20000/20000 -> 10/10/10,
  sin cambiar los ids devueltos ni el orden. Pasan de COLLSCAN/SORT a IXSCAN.
- Control sin categoria: examina 9000 claves y mantiene SORT; documentado.
- Email duplicado rechazado por indice unique.
- Planes y resultados reales en docs/evidencias/indices/explain.json y README.md.
- Este ensayo no mide Atlas ni modifica sus datos/indices.
- Evidencia de indices publicada en commit 0985195, rama matias/evidencia-indices.
- Scripts de Brenda sin modificar.

## Pruebas de integracion - 22/10/2026
- Comando: npm run evidence:integration desde backend.
- 48 solicitudes HTTP y 4 comprobaciones directas MongoDB aprobadas.
- Express y MongoDB 7.0.24 reales sobre base temporal aislada; sin Atlas ni .env.
- Cubiertos CRUD, email duplicado, campos prohibidos, referencias inactivas,
  total calculado, historial, transiciones, fechas inclusivas/exclusivas,
  reporte multi-item, filtros, paginacion y conservacion fisica tras baja.
- Solicitudes/respuestas: docs/evidencias/integracion/http.json.
- Guia y resultados: docs/pruebas-integracion.md.
- Evidencia de integracion preparada para publicar en matias/evidencia-indices.
