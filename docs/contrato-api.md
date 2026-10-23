# Contrato de API v1

Base local: http://localhost:3000/api. Base de negocio: tpi_tienda.
API Express sin autenticacion HTTP, prevista para demostracion local.
El navegador usa la API; las credenciales Atlas solo pertenecen al backend.

## Convenciones
- JSON en solicitudes y respuestas; enviar Content-Type: application/json.
- ObjectId BSON en MongoDB; id y referencias como strings hexadecimales de 24 caracteres en JSON.
- Fechas BSON Date en MongoDB; ISO 8601 UTC en respuestas.
- Importes en centavos enteros positivos seguros: 150050 representa ARS 1500,50.
- activo, createdAt, updatedAt y deletedAt son administrados por el servidor.
- Campos desconocidos o reservados en cuerpos se rechazan con HTTP 400.
- Listados, detalles, modificaciones y bajas solo operan sobre documentos activos.
- DELETE es baja logica y no elimina documentos fisicamente.
- Coordinar cambios de contrato con quienes lo consumen.

## Rutas
Todas las rutas de la tabla se agregan a /api.

| Metodo | Ruta | Operacion | Exito |
| --- | --- | --- | --- |
| GET | /health | Ping a MongoDB | 200 |
| GET | /clientes, /productos, /pedidos | Listado activo | 200 |
| POST | /clientes, /productos, /pedidos | Alta | 201 |
| GET | /clientes/:id, /productos/:id, /pedidos/:id | Detalle activo | 200 |
| PATCH | /clientes/:id, /productos/:id | Actualizacion parcial | 200 |
| PATCH | /pedidos/:id | Solo cambio de estado | 200 |
| DELETE | /clientes/:id, /productos/:id, /pedidos/:id | Baja logica | 200 |
| GET | /reportes/ventas-por-categoria | Ventas completadas activas | 200 |

## Entradas por entidad
### Clientes
POST requiere nombre, apellido y email no vacios. contacto es opcional y por
defecto {}. Sus campos opcionales son telefono y direccion, ambos strings.
El email se recorta y normaliza a minusculas; es unico incluso entre inactivos.
PATCH permite nombre, apellido, email y contacto. PATCH contacto reemplaza el
objeto completo: enviar todos los campos que se quieran conservar.

### Productos
POST requiere nombre, categoria y precioCentavos. Categorias: tecnologia,
libreria, hogar. descripcion es opcional y por defecto "".
PATCH permite esos mismos cuatro campos. No hay stock.

### Pedidos
POST requiere clienteId e items con productoId y cantidad; entre 1 y 50
productos distintos y cantidades enteras de 1 a 100. Las referencias deben
existir y estar activas. No enviar precios, total, instantaneas ni estado.
El servidor calcula precioUnitarioCentavos, subtotalCentavos y totalCentavos.
Conserva nombre/categoria del producto y nombre/apellido/email del cliente.
El estado inicial es pendiente. No se editan cliente ni items despues del alta.
PATCH admite solo estado:
- pendiente -> confirmado o cancelado.
- confirmado -> completado o cancelado.
- completado y cancelado son terminales.
Repetir estado o transicion invalida devuelve 409. La actualizacion incluye
el estado previo en el filtro para evitar sobrescritura concurrente.
La lectura del catalogo y el alta no forman una transaccion global.

## Consultas y paginacion
Los listados admiten pagina (1 por defecto) y limite (10 por defecto, maximo
100), enteros positivos. Orden: createdAt descendente y _id descendente.
total cuenta documentos coincidentes, no paginas. Productos admite categoria.
Pedidos admite clienteId, estado, desde y hasta. Query desconocida: HTTP 400.
desde/hasta requieren ISO 8601 con zona y filtran createdAt. Desde inclusivo,
hasta exclusivo. Se rechaza desde >= hasta. Para incluir un dia completo,
convertir medianoche local y la del dia siguiente a ISO con zona.

Respuesta de listado:
~~~json
{"data":[],"paginacion":{"pagina":1,"limite":10,"total":0}}
~~~
Detalle, alta y PATCH: {"data": recurso completo}.
DELETE: {"data":{"id":"...","activo":false}}.
Health disponible: {"data":{"estado":"ok"}}. Sin MongoDB: HTTP 503 y
ERROR_INTERNO, sin datos de conexion.

## Reporte
GET /reportes/ventas-por-categoria admite desde/hasta con las mismas reglas.
Solo pedidos activos y completados, por fecha de creacion del pedido.
Agrupa por categoria historica, suma cantidades/subtotales y ordena categoria.
Sin resultados: {"data":[]}. Pipeline: match, unwind, group, project, sort.
No sumar totalCentavos despues de unwind: duplicaria importes.
Limitacion conocida: agregados extremadamente grandes pueden superar el rango
seguro de JavaScript; queda pendiente controlar ese limite en el reporte.

## Errores
Formato: {"error":{"codigo":"VALIDACION","mensaje":"...","campo":"email"}}.
campo es opcional y senala el dato que requiere correccion.

| HTTP | Codigo | Situacion |
| --- | --- | --- |
| 400 | VALIDACION | Campos, ids, fechas o cantidades invalidos |
| 404 | NO_ENCONTRADO | Recurso inexistente, inactivo o ruta inexistente |
| 409 | EMAIL_DUPLICADO | Email ya registrado |
| 409 | TRANSICION_INVALIDA | Estado invalido, repetido o conflicto |
| 413 | VALIDACION | JSON mayor que el limite de 100 kb |
| 500 | ERROR_INTERNO | Error no previsto, sin stack ni credenciales |
| 503 | ERROR_INTERNO | MongoDB no disponible en /health |

## Ejemplos verificados
Proceden de docs/evidencias/integracion/http.json: Express y MongoDB temporal.
Los ids/fechas pertenecen a esa ejecucion aislada: no reutilizarlos en Atlas.
Obtener ids vigentes mediante GET o POST. Repetir de forma aislada ejecutando
npm run evidence:integration desde backend.

## Alta y normalizacion de email

POST /api/clientes

~~~json
{
  "nombre": "Ana",
  "apellido": "Prueba",
  "email": " ANA@EXAMPLE.COM ",
  "contacto": {
    "telefono": "111",
    "direccion": "Calle ficticia"
  }
}
~~~

Respuesta real HTTP 201:

~~~json
{
  "data": {
    "nombre": "Ana",
    "apellido": "Prueba",
    "email": "ana@example.com",
    "contacto": {
      "telefono": "111",
      "direccion": "Calle ficticia"
    },
    "activo": true,
    "createdAt": "2026-10-22T13:33:07.388Z",
    "updatedAt": "2026-10-22T13:33:07.388Z",
    "deletedAt": null,
    "id": "6ada109378842e4ec930e230"
  }
}
~~~

## Alta de producto en centavos

POST /api/productos

~~~json
{
  "nombre": "Mouse",
  "categoria": "tecnologia",
  "precioCentavos": 150000
}
~~~

Respuesta real HTTP 201:

~~~json
{
  "data": {
    "nombre": "Mouse",
    "categoria": "tecnologia",
    "precioCentavos": 150000,
    "descripcion": "",
    "activo": true,
    "createdAt": "2026-10-22T13:33:07.429Z",
    "updatedAt": "2026-10-22T13:33:07.429Z",
    "deletedAt": null,
    "id": "6ada109378842e4ec930e234"
  }
}
~~~

## Alta de pedido y total calculado por servidor

POST /api/pedidos

~~~json
{
  "clienteId": "6ada109378842e4ec930e230",
  "items": [
    {
      "productoId": "6ada109378842e4ec930e234",
      "cantidad": 2
    },
    {
      "productoId": "6ada109378842e4ec930e235",
      "cantidad": 1
    }
  ]
}
~~~

Respuesta real HTTP 201:

~~~json
{
  "data": {
    "clienteId": "6ada109378842e4ec930e230",
    "cliente": {
      "nombre": "Ana editada",
      "apellido": "Prueba",
      "email": "ana@example.com"
    },
    "estado": "pendiente",
    "items": [
      {
        "productoId": "6ada109378842e4ec930e234",
        "cantidad": 2,
        "nombre": "Mouse",
        "categoria": "tecnologia",
        "precioUnitarioCentavos": 150000,
        "subtotalCentavos": 300000
      },
      {
        "productoId": "6ada109378842e4ec930e235",
        "cantidad": 1,
        "nombre": "Cuaderno",
        "categoria": "libreria",
        "precioUnitarioCentavos": 20000,
        "subtotalCentavos": 20000
      }
    ],
    "totalCentavos": 320000,
    "activo": true,
    "createdAt": "2026-10-22T13:33:07.489Z",
    "updatedAt": "2026-10-22T13:33:07.489Z",
    "deletedAt": null,
    "id": "6ada109378842e4ec930e236"
  }
}
~~~

## Email duplicado normalizado

POST /api/clientes

~~~json
{
  "nombre": "Otra",
  "apellido": "Persona",
  "email": "ANA@example.com"
}
~~~

Respuesta real HTTP 409:

~~~json
{
  "error": {
    "codigo": "EMAIL_DUPLICADO",
    "mensaje": "Email ya registrado",
    "campo": "email"
  }
}
~~~

## Reporte no duplica total al separar items

GET /api/reportes/ventas-por-categoria

Respuesta real HTTP 200:

~~~json
{
  "data": [
    {
      "unidadesVendidas": 1,
      "importeCentavos": 20000,
      "categoria": "libreria"
    },
    {
      "unidadesVendidas": 2,
      "importeCentavos": 300000,
      "categoria": "tecnologia"
    }
  ]
}
~~~
