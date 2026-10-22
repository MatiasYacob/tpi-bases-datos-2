# Modelo y Atlas
Colecciones: clientes, productos, pedidos. Base tpi_tienda.
Implementacion: backend/src/config/schema.js.
Contacto e items embebidos; clienteId y productoId enlazan entidades.
Pedidos copian nombre/email del cliente y nombre/categoria/precio del producto.
Cambios posteriores no reescriben el historial. Fechas BSON Date; ids ObjectId.
API serializa id string y fechas ISO UTC. Importes en centavos enteros seguros.
Baja logica mediante activo, deletedAt y updatedAt; email unico permanente.
Indices: email unico; productos por activo/categoria/createdAt/_id;
pedidos por activo/createdAt/_id y por clienteId/activo/estado/createdAt/_id.
Validadores controlan estructura. Backend valida referencias y transiciones.
Atlas provisionado y conexion comprobada el 18/10/2026.
Evidencia explain ejecutada el 22/10/2026 en MongoDB temporal local, con filtros
de los endpoints e indices del proyecto: ver evidencias/indices/README.md.
No se extrapolan tiempos locales a Atlas ni se afirma mejora para todo filtro.
