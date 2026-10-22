# Backend - Matias
API Express 5 + driver oficial MongoDB. Node probado: 24.13.1, npm 11.8.0.

## Arranque
Desde backend:
1. npm ci
2. Copy-Item .env.example .env
3. Configurar MONGODB_URI localmente; MONGODB_DB=tpi_tienda.
4. npm run db:init
5. npm run seed
6. npm run dev

API: http://127.0.0.1:3000/api. Frontend permitido: http://localhost:5173.
GET /api/health comprueba MongoDB. No se necesita instalar Express globalmente.
Atlas: crear cluster, usuario de app y acceso de red para tu IP. El usuario que
ejecuta db:init necesita crear colecciones, validadores e indices.
Nunca publicar .env ni copiar la URI a capturas, mensajes o commits.
Este servidor se limita por defecto a localhost; no tiene autenticacion.

## Modulos
- config/db.js: conexion reutilizable; solo base tpi_tienda.
- config/schema.js: validadores BSON e indices; modifica estructura, no borra datos.
- routes/resources.js: HTTP y CRUD; solo modifica clientes/productos/pedidos.
- services: entradas, estados, instantaneas, calculos y pipeline.
- repositories/resources.js: lectura activa y conversion BSON/JSON.
- scripts: preparacion y seed repetible sin borrar ni sobrescribir datos.
- test: pruebas contra MongoDB temporal aislado; no usa Atlas ni .env.

## Verificacion
npm test descarga un binario oficial de MongoDB la primera vez y ejecuta
MongoDB temporal local. Prueba API real con driver, validadores e indices.
La ejecucion en Atlas y explain con datos reales se verifican por separado.

## Contrato y decisiones
Rutas bajo /api: clientes, productos y pedidos (GET/POST y GET/PATCH/DELETE :id),
reportes/ventas-por-categoria y health. Ver ../docs/contrato-api.md.
DELETE es baja logica. Email normalizado unico incluso en inactivos.
Importes enteros seguros en centavos. Pedidos guardan copias historicas.
Cambios de estado usan el estado anterior como condicion de actualizacion.
El reporte usa subtotales por item; no suma el total del pedido tras unwind.
El seed reserva ids 1..3, 101..109 y 201..206 en hexadecimal; no depende de ellos
el frontend, que debe obtener los ids por GET. Ejecutar seed sobre base inicial;
si sus referencias ya fueron desactivadas puede fallar sin borrar datos.

## Limites pendientes
Conexion y ejecucion real en Atlas verificadas el 18/10/2026.
Comparacion explain local reproducible completada el 22/10/2026; no es una medicion de Atlas. No se garantiza una instantanea global entre
lecturas concurrentes de catalogo y creacion del pedido; para la demostracion
evitar editar/desactivar referencias mientras se crea un pedido.
Para backup coherente pausar escrituras y compartir conteos con Brenda.
Responsable: Matias. Revisor: Javier. No publicar ni integrar sin revision.

## Resultado verificado el 18/10/2026
npm test: 4 pruebas de integracion aprobadas contra MongoDB 7.0.24 temporal.
Sintaxis de todos los modulos correcta. npm install: 0 vulnerabilidades reportadas.
No se ejecuto contra Atlas ni se midio rendimiento de indices.

## Evidencia de indices
Desde backend: npm run evidence:indexes.
Ejecuta MongoDB 7.0.24 temporal con datos sinteticos; no lee .env ni conecta a Atlas.
Reutiliza filtros del backend e indices de config/schema.js y compara resultados.
Guarda planes, estadisticas y explicacion en ../docs/evidencias/indices/.
Requiere dependencias de desarrollo (npm ci sin omitir devDependencies).
Las comprobaciones del ensayo verifican igualdad de resultados/orden, uso de indices
y reduccion de documentos examinados en tres consultas concretas.
Incluye un cuarto caso de control sin categoria que aun necesita ordenar.
