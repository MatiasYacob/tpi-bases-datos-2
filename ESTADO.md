# Estado del proyecto
18 de octubre de 2026. Rama de trabajo: codex/backend.

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
- Revision de Javier e integracion de la rama mediante pull request.
- Medir explain executionStats antes/despues de indices y guardar evidencia.
- Crear acceso separado de respaldo para Brenda por canal privado.
- Implementar y probar backup/restauracion con datos y conteos conocidos.
- Completar evidencia y documentacion de entrega.
