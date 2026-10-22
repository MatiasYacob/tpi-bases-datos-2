# Pruebas de integracion

Responsable: Matias. Revisor previsto: Javier.

## Resultado real

Ejecucion UTC: 2026-10-22T13:33:07.639Z. Node v24.13.1; MongoDB 7.0.24.
Peticiones HTTP verificadas: 48. Comprobaciones adicionales MongoDB: 4. Todas aprobadas.

## Alcance y reproducibilidad

Desde backend: npm ci y npm run evidence:integration.
El script usa Supertest para solicitudes HTTP a Express y el driver oficial contra MongoDB temporal real.
No utiliza mocks de repositorios, no lee .env y no conecta a Atlas.
Incluye validadores e indices del proyecto; el proceso cierra el servidor temporal al terminar.
Los emails y nombres son ficticios. Las fechas se fijan en el setup temporal para probar limites.
Esto demuestra integracion API/persistencia local. No es una nueva prueba de navegador, Atlas ni backups.
La prueba de concurrencia, JSON malformado y seed repetible sigue en npm test.
Cada ejecucion sobrescribe este documento y evidencias/integracion/http.json.

## Casos HTTP

| Caso | Metodo | HTTP esperado/obtenido | Resultado |
| --- | --- | ---: | --- |
| Salud con MongoDB disponible | GET | 200 | APROBADO |
| Listado inicialmente vacio | GET | 200 | APROBADO |
| Alta y normalizacion de email | POST | 201 | APROBADO |
| Alta sin contacto | POST | 201 | APROBADO |
| Email duplicado normalizado | POST | 409 | APROBADO |
| Edicion de cliente y reemplazo de contacto | PATCH | 200 | APROBADO |
| Campo reservado rechazado | PATCH | 400 | APROBADO |
| Identificador mal formado | GET | 400 | APROBADO |
| Identificador inexistente | GET | 404 | APROBADO |
| Alta de producto en centavos | POST | 201 | APROBADO |
| Alta de segunda categoria | POST | 201 | APROBADO |
| Precio fraccionario rechazado | POST | 400 | APROBADO |
| Categoria fuera del contrato | POST | 400 | APROBADO |
| Filtro de categoria | GET | 200 | APROBADO |
| Limite mayor que 100 rechazado | GET | 400 | APROBADO |
| Primera pagina y orden por id en empate de fecha | GET | 200 | APROBADO |
| Segunda pagina sin duplicados | GET | 200 | APROBADO |
| Total enviado por navegador rechazado | POST | 400 | APROBADO |
| Precio enviado por navegador rechazado | POST | 400 | APROBADO |
| Producto repetido rechazado | POST | 400 | APROBADO |
| Cantidad fuera de rango rechazada | POST | 400 | APROBADO |
| Alta de pedido y total calculado por servidor | POST | 201 | APROBADO |
| Cambio del precio actual | PATCH | 200 | APROBADO |
| Cambio del nombre actual del cliente | PATCH | 200 | APROBADO |
| Detalle conserva instantaneas y precios historicos | GET | 200 | APROBADO |
| Pedido no permite editar items | PATCH | 400 | APROBADO |
| No se puede saltar de pendiente a completado | PATCH | 409 | APROBADO |
| Transicion pendiente a confirmado | PATCH | 200 | APROBADO |
| Repetir estado da conflicto | PATCH | 409 | APROBADO |
| Transicion confirmado a completado | PATCH | 200 | APROBADO |
| Estado terminal no admite cancelacion | PATCH | 409 | APROBADO |
| Reporte no duplica total al separar items | GET | 200 | APROBADO |
| Desde incluye el instante limite | GET | 200 | APROBADO |
| Hasta excluye el instante limite | GET | 200 | APROBADO |
| Intervalo invertido rechazado | GET | 400 | APROBADO |
| Filtro combinado cliente estado y fecha | GET | 200 | APROBADO |
| Baja logica de producto | DELETE | 200 | APROBADO |
| Producto inactivo no se lee por detalle | GET | 404 | APROBADO |
| Producto inactivo no se edita | PATCH | 404 | APROBADO |
| Pedido con producto inactivo rechazado | POST | 404 | APROBADO |
| Baja logica de cliente | DELETE | 200 | APROBADO |
| Cliente inactivo oculto del listado | GET | 200 | APROBADO |
| Email de inactivo no se reutiliza | POST | 409 | APROBADO |
| Pedido con cliente inactivo rechazado | POST | 404 | APROBADO |
| Historial sigue disponible tras bajas de referencias | GET | 200 | APROBADO |
| Baja logica de pedido | DELETE | 200 | APROBADO |
| Pedido inactivo oculto por detalle | GET | 404 | APROBADO |
| Reporte excluye pedidos dados de baja | GET | 200 | APROBADO |

## Comprobaciones directas sobre MongoDB

- Altas invalidas no insertaron pedidos: APROBADO.
- Referencias inactivas no insertaron pedidos extra: APROBADO.
- Bajas conservan documentos y fechas BSON: APROBADO.
- MongoDB rechaza escritura que incumple jsonSchema: APROBADO.

## Evidencia de solicitudes y respuestas

El archivo [http.json](evidencias/integracion/http.json) conserva metodo, ruta, cuerpo enviado,
HTTP esperado y cuerpo real devuelto para cada peticion. Los ids se obtienen de las respuestas,
no de ids fijos de Atlas. Cualquier asercion fallida termina el comando con codigo distinto de cero.
Los archivos solo se escriben despues de que todas las comprobaciones pasaron.

## Ejemplo del flujo verificado

Se crea Mouse a 150000 centavos y Cuaderno a 20000. Un pedido de dos Mouse y un
Cuaderno devuelve totalCentavos=320000 calculado por el servidor.
Luego se cambia Mouse a 190000 y el nombre del cliente: el pedido conserva sus datos historicos.
Al completarlo, el reporte separa tecnologia=300000 y libreria=20000; no duplica el total.
La baja de cliente/producto no borra el historial. La baja del pedido lo excluye del reporte.

## Pendiente para el cierre grupal

- Revision cruzada de Javier ejecutando los comandos.
- Incorporar al informe capturas reales de frontend/Atlas realizadas por el equipo.
- Integrar la evidencia de restauracion de Brenda cuando cierre sus pruebas.
