# Evidencia de indices: explain executionStats

Ejecucion UTC: 2026-10-22T13:25:23.442Z. Node v24.13.1; MongoDB 7.0.24.

## Alcance

Prueba local real, reproducible y aislada. No representa una medicion de Atlas.
Muestra sintetica determinista: 100 clientes, 10000 productos y 20000 pedidos.
Se reutilizan los filtros y paginacion del backend y los indices de config/schema.js.
Antes: solo indice _id_. Despues: indices reales del proyecto. No se usa hint.
Cada consulta devuelve 10 documentos; se verifican los mismos ids en el mismo orden.
El caso por cliente/estado incluye intervalo de fechas. El frontend actualmente
descarga todos los listados; estos casos corresponden a los endpoints del backend.

## Resultados

| Consulta | Fase | Etapas | Docs examinados | Claves examinadas | Devueltos | ms |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Productos activos por categoria | antes | SORT / COLLSCAN | 10000 | 0 | 10 | 14 |
| Productos activos por categoria | despues | LIMIT / FETCH / IXSCAN | 10 | 10 | 10 | 2 |
| Pedidos activos generales | antes | SORT / COLLSCAN | 20000 | 0 | 10 | 24 |
| Pedidos activos generales | despues | LIMIT / FETCH / IXSCAN | 10 | 10 | 10 | 1 |
| Pedidos de un cliente por estado y fecha | antes | SORT / COLLSCAN | 20000 | 0 | 10 | 17 |
| Pedidos de un cliente por estado y fecha | despues | LIMIT / FETCH / IXSCAN | 10 | 10 | 10 | 1 |
| Control: productos sin filtro de categoria | antes | SORT / COLLSCAN | 10000 | 0 | 10 | 12 |
| Control: productos sin filtro de categoria | despues | FETCH / SORT / IXSCAN | 10 | 9000 | 10 | 15 |

## Interpretacion para la defensa

- COLLSCAN recorre documentos de la coleccion. IXSCAN recorre claves de un indice.
- FETCH recupera el documento: estas consultas devuelven documentos completos y no son consultas cubiertas.
- SORT indica ordenamiento explicito. En los tres casos principales el indice tambien resuelve el orden.
- En productos, activo y categoria fijan el prefijo; createdAt e _id resuelven el orden.
- En pedidos generales, activo fija el prefijo; las fechas e ids resuelven el orden.
- En pedidos por cliente/estado, las igualdades clienteId/activo/estado preceden al rango y orden temporal.
- Sin categoria, el indice de productos no garantiza el orden global por fecha porque categoria esta en medio.
  Ese caso de control muestra por que un indice no mejora todas las variantes de una consulta.
- Las claves examinadas se cuentan aparte de los documentos. La comparacion usa ambas metricas.
- Los milisegundos son observaciones de una ejecucion local, afectados por cache y seleccion de plan.
  No constituyen un benchmark ni permiten prometer el mismo tiempo o factor de mejora en Atlas.
- Los indices tienen costo de almacenamiento y mantenimiento en las escrituras.
- El indice unico de email tambien protege integridad: se comprobo rechazo de duplicado (11000).
- No se modifican los indices productivos ni se corrige un esquema sobre Atlas en este ensayo.

## Reproducir

Desde backend: npm ci y npm run evidence:indexes.
Requiere las dependencias de desarrollo. Descarga MongoDB 7.0.24 oficial si no esta en cache.
No requiere .env. El proceso inicia su propio MongoDB temporal y lo cierra en finally.
Sobrescribe solo docs/evidencias/indices/explain.json y este resumen con la nueva medicion.
La salida JSON conserva consultas, planes ganadores/rechazados y executionStats para auditar.
Los resultados numericos pueden variar segun entorno; las comprobaciones se ejecutan en cada ensayo.

Referencia: https://www.mongodb.com/docs/v7.0/reference/explain-results/
