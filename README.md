# TPI · Bases de Datos 2

Aplicación de gestión de una tienda desarrollada como Trabajo Práctico Integrador de Bases de Datos 2. Permite administrar clientes y productos, registrar pedidos y consultar ventas por categoría.

**React + TypeScript** · **Node.js + Express** · **MongoDB Atlas**

## Qué hace la aplicación

- **Clientes y productos.** Alta, consulta, edición y baja lógica.
- **Pedidos.** Registro, cambios de estado y conservación de los datos históricos de cada pedido.
- **Ventas.** Reporte por categoría de producto.
- **Base de datos.** Validadores BSON e índices para las consultas documentadas.
- **Respaldos.** Copias con `mongodump`, retención de hasta cinco fechas completas y restauración de prueba local.

[Recorrido de la aplicación](frontend/USO.md) · [Estado y límites conocidos](ESTADO.md)

## Inicio rápido

Necesitás **Node.js 24**, npm y acceso a MongoDB local o Atlas. Copiá `backend/.env.example` como `backend/.env` y configurá `MONGODB_URI` para la base `tpi_tienda`. Copiá también `frontend/.env.example` como `frontend/.env`. El frontend solo necesita la URL de la API en `VITE_API_URL`.

Instalá y arrancá el backend desde la raíz del repositorio:

```sh
cd backend
npm ci
npm start
```

Si usás una base nueva, ejecutá `npm run db:init` y `npm run seed` desde `backend/` antes de `npm start`. La base compartida ya preparada permite omitir ese paso.

En otra terminal, desde la raíz del repositorio:

```sh
cd frontend
npm ci
npm run dev
```

Abrí <http://localhost:5173>. La configuración de ejemplo del frontend apunta a <http://localhost:3000/api>.

## Dónde está cada cosa

| Carpeta | Contenido |
| --- | --- |
| [`backend/`](backend/) | API Express, validadores, acceso a MongoDB y pruebas |
| [`frontend/`](frontend/) | Interfaz React y cliente de la API |
| [`scripts/`](scripts/) | Respaldo, programación y restauración para Windows y macOS |
| [`docs/`](docs/) | Diseño, procedimientos y evidencias |
| [`output/pdf/`](output/pdf/) | Informe y otros documentos de entrega en PDF |

## Pruebas y evidencias

Desde `backend/`:

```sh
npm test
npm run evidence:integration
npm run evidence:indexes
```

Estas pruebas usan una instancia temporal de MongoDB y pueden descargar el ejecutable oficial en la primera ejecución. Desde `frontend/`, `npm run build` verifica TypeScript y compila la aplicación.

En Windows, `npm run evidence:windows` desde `backend/` comprueba once escenarios de respaldo y restauración con Windows PowerShell 5.1 y MongoDB Database Tools. Las herramientas se pueden indicar con `TPI_TOOLS_BIN`, incluir en `PATH` o ubicar en `.tools/`.

| Tema | Referencias |
| --- | --- |
| Datos e índices | [Modelo](docs/modelo.md) · [Evidencias de índices](docs/evidencias/indices/) |
| API e integración | [Contrato de la API](docs/contrato-api.md) · [Pruebas de integración](docs/pruebas-integracion.md) · [Revisión cruzada](docs/revision-cruzada.md) |
| Aplicación | [Guía del backend](backend/README.md) · [Guía del frontend](frontend/README.md) |
| Respaldos | [Scripts y configuración](scripts/README.md) · [macOS](docs/respaldo.md) · [Windows](docs/respaldos-windows.md) · [Evidencias](docs/evidencias/respaldo/) |

Los respaldos se guardan por fecha en `resguardos_tpi`. Las restauraciones de prueba usan la base local `tpi_tienda_restore_test`. Mantené las credenciales de Atlas, los archivos de configuración privados y los volcados fuera de Git.

## Equipo

| Integrante | Responsabilidad |
| --- | --- |
| Matías Yacob | Modelo, Atlas, backend, validaciones, índices, reporte y scripts Windows |
| Javier Rodríguez | Frontend, integración con la API y revisión cruzada |
| Brenda Florencia Romero | Respaldo, programación y restauración en macOS |

Los cambios se integran mediante pull requests revisados por el grupo.
