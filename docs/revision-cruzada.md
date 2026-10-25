# Revision cruzada del backend
Responsable: Matias Yacob. Revisor previsto: Javier.
Estado: ejecutada el 25/10/2026 en el equipo de Javier.
Veredicto: aprobado con observaciones. El detalle esta en el registro.

## Ejecucion independiente
Desde una copia actualizada del repositorio, con Node 24:
1. Entrar en backend y ejecutar npm ci.
2. npm test: se esperan 10 pruebas aprobadas (incluye seis regresiones de restauracion).
3. npm run evidence:integration: 48 solicitudes HTTP y 4 comprobaciones MongoDB.
4. npm run evidence:indexes: tres consultas con menos documentos examinados
   y mismos resultados/orden antes y despues; el control sin categoria mantiene SORT.
No necesitan .env ni acceso a Atlas. Usan MongoDB temporal y pueden descargar
el ejecutable oficial 7.0.24 la primera vez. Regeneran los archivos de evidencia:
no subir cambios automaticamente si solo se estaba revisando.

## Revision funcional
Con backend/.env configurado privadamente:
- Iniciar backend con npm start y frontend con npm ci / npm run dev.
- En localhost:5173 crear cliente/producto ficticios identificables.
- Crear pedido y comprobar total servidor e historial tras editar el catalogo.
- Cambiar pendiente -> confirmado -> completado y revisar reporte.
- Verificar email duplicado, errores y baja logica.
- Al terminar, dar de baja solo los registros ficticios propios.
Esta parte utiliza Atlas y requiere coordinar con el equipo.
No ejecutar seed, db:init ni eliminar datos ajenos como parte de la revision.

## Registro a completar por Javier
- Fecha/hora: 25/10/2026, 10:29 a 10:37 (UTC-3).
- Sistema operativo y Node: Windows 10.0.26200, Node v24.13.1, npm 11.8.0.
- Commit revisado: 8578457 (Merge pull request #6, matias/documentacion-entrega).
- npm test: 10 pruebas aprobadas, 0 fallos, 9,2 s. Incluye CRUD, historial, estados, reporte y seis regresiones de restauracion. MongoDB temporal; no uso .env.
- evidence:integration: APROBADO. 48 solicitudes HTTP y 4 comprobaciones MongoDB. Ejecucion UTC 2026-10-25T13:29:56.310Z, Node v24.13.1, MongoDB 7.0.24.
- evidence:indexes: las tres consultas conservan 10 resultados y bajan de 10000/20000/20000 documentos examinados a 10/10/10, con IXSCAN. El control sin categoria queda en FETCH/SORT/IXSCAN, examina 10 documentos y 9000 claves, y mantiene SORT. Ejecucion UTC 2026-10-25T13:30:10.458Z.
- Flujos de interfaz realmente ejecutados: con backend en http://127.0.0.1:3000/api y frontend en http://localhost:5173. Alta de cliente Revision Javier (revision.javier.20261025@example.com) y producto "Producto revision Javier 20261025" a $ 123,45, categoria Tecnologia. Pedido de 2 unidades: el servidor guardo total $ 246,90. Estados pendiente, confirmado y completado. Tras cambiar el catalogo a $ 200,00, el detalle siguio mostrando $ 123,45 c/u y total $ 246,90. El reporte, antes de la baja, mostro Tecnologia con 2 unidades y $ 246,90. Email duplicado dejo el formulario abierto, conservo lo escrito y mostro "email: Email ya registrado". Busqueda de cliente y de producto, y paginacion visible en productos (1-5 de 10) y pedidos (1-5 de 7). Recarga de la pagina: los datos seguian. Bajas logicas solo de esos tres registros.
- Observaciones y pasos para reproducir: no se encontro un fallo funcional en los flujos ejecutados. No se probaron la vista movil, el recorrido solo con teclado ni el corte del backend con "Reintentar carga". Los filtros de categoria y de estado se vieron en pantalla; la busqueda si se uso para aislar los registros propios.
- Evidencia propia sin credenciales: salida de los tres comandos. docs/pruebas-integracion.md, docs/evidencias/indices/README.md, explain.json y docs/evidencias/integracion/http.json se regeneraron en esta ejecucion: cambian la fecha y los tiempos, con los mismos resultados. Comprobacion directa, sin imprimir la URI: los tres documentos siguen en la base con activo false y deletedAt. El producto inactivo quedo en 20000 centavos y el item del pedido en 12345.
- Veredicto: aprobado con observaciones.

## Preguntas de defensa
1. Por que items esta embebido pero conserva productoId?
2. Por que editar precios no modifica pedidos anteriores?
3. Como se demuestra que DELETE no borro documentos?
4. Por que sumar subtotalCentavos despues de unwind?
5. Que distinguen COLLSCAN, IXSCAN, FETCH y SORT?
6. Por que el indice de productos no evita SORT sin categoria?

## Mensaje listo para compartir
Javi, ya integramos las evidencias de indices y pruebas del backend. Te deje
docs/revision-cruzada.md con los pasos. Necesitamos que ejecutes los tres
comandos desde backend y registres resultados y observaciones. Las pruebas
automaticas usan MongoDB temporal y no necesitan contrasenas.
La aprobacion queda pendiente hasta que completes tu revision.
