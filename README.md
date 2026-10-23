# TPI - Bases de Datos 2

Tienda de prueba con clientes, productos y pedidos en MongoDB Atlas.

| Integrante | Responsabilidad |
| --- | --- |
| Matías Yacob | Modelo, Atlas, backend Express, validaciones, índices y reporte |
| Javier | Frontend React + Vite e integración con la API |
| Brenda | Respaldos PowerShell, programación y restauración |

La guía integrada en `docs/guia-integrada.pdf` es el contrato inicial del grupo.
Todos documentan su parte y deben poder explicar el sistema completo.

## Estado actual

Backend Express conectado a MongoDB Atlas y frontend React integrado con la API.
Incluye CRUD con baja logica, pedidos con historial, reporte, validadores,
indices y seed. Los scripts de respaldo/restauracion siguen pendientes.

- [Ejecutar backend](backend/README.md)
- [Ejecutar frontend](frontend/README.md)
- [Estado y pendientes](ESTADO.md)

Cada equipo configura su propio backend/.env y acceso de red a Atlas.
No se distribuyen credenciales por Git.

## Trabajo en equipo

Crear ramas por tarea, por ejemplo `matias/backend`, `javier/frontend` y
`brenda/respaldos`. Integrar mediante pull requests revisados por otro integrante.
Matías revisa respaldo, Brenda frontend y Javier modelo/backend.
Comunicar cambios de contratos antes de integrarlos.

## Configuración y secretos

No subir URI con credenciales, archivos .env reales ni respaldos.
Las plantillas .env.example muestran variables sin secretos.
La base acordada es tpi_tienda. La restauración se prueba en
tpi_tienda_restore_test. Usar solo datos ficticios.

## Documentacion de entrega
- [Contrato API y ejemplos](docs/contrato-api.md)
- [Pruebas de integracion](docs/pruebas-integracion.md)
- [Ficha de revision de Javier](docs/revision-cruzada.md)
- [Informe tecnico para revision](output/pdf/informe-tpi-bd2.pdf)
- [Fuente editable del informe](docs/informe-tpi.md)

Regenerar el informe: python docs/generar-informe.py, con reportlab instalado.
El informe es de revision: falta la aprobacion independiente y el cierre de
evidencia de respaldo Atlas de Brenda antes de presentarlo como final.
