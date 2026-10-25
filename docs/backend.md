# Backend
Responsable: Matias. Revisor: Javier.
Objetivo: API local Express y persistencia MongoDB para clientes, productos y pedidos.
Entradas: JSON y filtros segun contrato-api.md. Salidas: JSON, ids string y fechas ISO.
Modifica solo la base tpi_tienda; nunca el destino de restauracion de Brenda.
Archivos y comandos: ver ../backend/README.md.
Validacion: npm test con MongoDB temporal; Atlas se verifica por separado.
Decisiones: driver oficial, baja logica, centavos enteros, historial embebido,
actualizacion de estado condicionada al estado previo.
Defensa: explicar embedding/linking, unicidad permanente, calculo del total y unwind.
Atlas y frontend integrados. Evidencia explain local: evidencias/indices/README.md.
Pruebas locales documentadas: pruebas-integracion.md y evidencias/integracion/http.json.
Revisión cruzada completada; ver revision-cruzada.md.
