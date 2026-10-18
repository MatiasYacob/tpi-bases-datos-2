# Frontend · TPI Tienda
React, TypeScript y Vite conectados a la API Express. Los cambios se guardan en
MongoDB Atlas a traves del backend y permanecen al recargar.

## Ejecutar
Node utilizado: 24.13.1. Desde frontend:
1. npm ci
2. Copy-Item .env.example .env (si no existe)
3. Configurar VITE_API_URL=http://localhost:3000/api
4. npm run dev
Abrir http://localhost:5173. El backend debe estar iniciado en el puerto 3000
con FRONTEND_ORIGIN=http://localhost:5173. Ver ../backend/README.md.
VITE_API_URL es publica: nunca guardar URI ni credenciales MongoDB en frontend.

## Estructura
- src/api/client.ts: fetch, timeout y errores HTTP/red; recorre paginas del backend.
- src/api/use-api-store.ts: carga de datos, escrituras y refresco desde la API.
- src/lib/models.ts y selectors.ts: tipos, moneda y calculos de presentacion.
- src/pages: vistas; src/components: formularios y piezas reutilizables.
- src/mocks: fixtures originales conservados; no se usan en la app conectada.

## Comportamiento
Busqueda, filtros y paginacion de listados se mantienen en el navegador para este
TPI. Se descargan todas las paginas del backend en lotes de 100, sin truncar
a los primeros 100 registros. Adecuado al volumen pequeno del ejercicio; para
volumen grande migrar cada pantalla a consultas paginadas remotas.
El reporte si envia filtros de fecha al servidor: desde inclusivo y hasta
medianoche del dia siguiente (exclusivo), convertidos de hora local a ISO UTC.

Altas, ediciones, bajas logicas y estados esperan confirmacion del servidor.
Los errores mantienen el formulario abierto y muestran el campo cuando existe.
El total del pedido guardado viene del backend, nunca del calculo visual.
Un fallo al refrescar despues de guardar muestra Reintentar carga sin repetir
la escritura. Si se pierde la respuesta de un POST, consultar antes de repetir:
el servidor aun no tiene claves de idempotencia.

## Validacion
npm run build: TypeScript y compilacion de produccion.
Pruebas manuales: alta persistente al recargar, email duplicado, pedido,
transiciones de estado, reporte y baja logica de datos ficticios.
No hay cambio al contrato ni acceso directo del navegador a Atlas.

## Resultado real de integracion - 18/10/2026
- npm run build aprobado (TypeScript estricto + Vite).
- Navegador: alta de cliente y persistencia al recargar.
- Email duplicado: error 409 del backend, campos conservados y email marcado.
- Producto: alta con 123,45 ARS y edicion a 234,56 ARS, luego baja logica.
- Pedido: alta con total servidor de 80000 centavos; pendiente -> confirmado
  -> completado. Reporte subio de 340000 a 420000 centavos.
- Backend detenido: error de conexion sin mostrar ceros como si fueran datos.
  Reiniciado: Reintentar carga recupero los datos correctamente.
- Datos ficticios de verificacion dados de baja logica, sin borrado fisico.
  Activos finales del seed: 2 clientes, 8 productos y 5 pedidos.
- Credenciales solo en backend/.env; frontend/.env contiene solo URL publica.
