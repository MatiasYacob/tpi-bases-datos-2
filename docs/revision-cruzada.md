# Revision cruzada del backend
Responsable: Matias Yacob. Revisor previsto: Javier.
Estado: PENDIENTE de ejecucion independiente por Javier.
Esta ficha preparada no equivale a la aprobacion del revisor.

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
- Fecha/hora:
- Sistema operativo y Node:
- Commit revisado:
- npm test:
- evidence:integration:
- evidence:indexes:
- Flujos de interfaz realmente ejecutados:
- Observaciones y pasos para reproducir:
- Evidencia propia sin credenciales:
- Veredicto: aprobado / aprobado con observaciones / requiere cambios.

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
