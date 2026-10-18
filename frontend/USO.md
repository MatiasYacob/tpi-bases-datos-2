# Uso de la tienda conectada
Iniciar backend y frontend segun sus README. Abrir http://localhost:5173.
La app carga los registros activos de la API; muestra carga, errores y reintento.

## Recorrido
1. Clientes: crear, buscar, editar contacto o dar de baja.
2. Productos: crear o editar precio/categoria y filtrar el catalogo.
3. Pedidos: elegir cliente/productos activos y cantidades. El total visible es
   estimativo; al guardar se muestra el total confirmado por el servidor.
4. Detalle: conserva cliente y precios historicos. Permite cambios de estado
   validos y baja logica separada de cancelar.
5. Reportes: ventas de pedidos activos completados, con fechas de creacion.
6. Recargar: los cambios permanecen guardados.

## Flujo de un pedido
Formulario -> useApiStore -> POST /api/pedidos -> Express -> MongoDB Atlas.
Express valida referencias, calcula instantaneas y total, y devuelve el pedido.
La app aplica la respuesta y refresca listados. Si falla la operacion mantiene
el formulario con sus valores y muestra el mensaje de error.
El reporte consulta GET /api/reportes/ventas-por-categoria; no usa datos simulados.

## Modulos
src/api: transporte y operaciones.
src/lib: tipos, moneda y calculos de presentacion.
src/components/forms: captura y validacion de interfaz.
src/pages: navegacion y filtros locales.
src/mocks: demostracion anterior conservada, sin uso en la app actual.
