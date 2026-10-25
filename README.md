# TPI - Bases de Datos 2

Tienda con clientes, productos y pedidos. Frontend React, API Express y persistencia en MongoDB Atlas.

| Integrante | Responsabilidad |
| --- | --- |
| Matías Yacob | Modelo, Atlas, backend, validaciones, índices, reporte y scripts Windows |
| Javier Rodríguez | Frontend e integración con la API; revisión cruzada |
| Brenda Florencia Romero | Respaldo, programación y restauración en macOS |

## Inicio

Requisitos: Node.js 24, npm y acceso a MongoDB. Instalar con npm ci dentro de backend y frontend. Las pruebas pueden descargar un ejecutable oficial de MongoDB temporal la primera vez.

1. En backend, copiar .env.example a .env y configurar MONGODB_URI. La base admitida es tpi_tienda.
2. Para una base nueva, ejecutar npm run db:init y npm run seed desde backend. En la base compartida ya preparada no es necesario repetirlos.
3. Ejecutar npm start dentro de backend.
4. En otra consola, copiar frontend/.env.example a frontend/.env y ejecutar npm run dev desde frontend.
5. Abrir http://localhost:5173. La API atiende en http://127.0.0.1:3000/api.

El ejemplo de URI del backend apunta a MongoDB local. Configurar la conexión privada a Atlas para utilizar el clúster del grupo. El frontend solo recibe VITE_API_URL; nunca la URI de MongoDB.

- [Backend: configuración y comandos](backend/README.md)
- [Frontend: instalación](frontend/README.md)
- [Recorrido de la aplicación](frontend/USO.md)

## Funcionalidad

CRUD con baja lógica, validadores BSON, índices, pedidos con datos históricos, cambios de estado y reporte de ventas por categoría. El respaldo usa mongodump de forma independiente del servidor Express.

## Pruebas

Desde backend:

```text
npm test
npm run evidence:integration
npm run evidence:indexes
```

Los ensayos utilizan MongoDB temporal y no leen las credenciales de Atlas. Desde frontend, npm run build verifica TypeScript y compila la aplicación.

En Windows, npm run evidence:windows comprueba once escenarios de respaldo/restauración con herramientas CLI reales sobre MongoDB temporal. Requiere Windows PowerShell 5.1 y MongoDB Database Tools disponibles mediante TPI_TOOLS_BIN, PATH o .tools/.

## Respaldos

- [Scripts de macOS y Windows](scripts/README.md)
- [Procedimiento y pruebas macOS](docs/respaldo.md)
- [Procedimiento y pruebas Windows](docs/respaldos-windows.md)

Se generan copias fechadas en resguardos_tpi y se conservan hasta cinco fechas completas. Las restauraciones de prueba utilizan exclusivamente tpi_tienda_restore_test en MongoDB local; los scripts no restauran sobre Atlas.

## Documentación técnica

- [Modelo e índices](docs/modelo.md)
- [Contrato API](docs/contrato-api.md)
- [Pruebas de integración](docs/pruebas-integracion.md)
- [Revisión cruzada](docs/revision-cruzada.md)
- [Estado y límites conocidos](ESTADO.md)

El informe y los documentos de entrega se preparan por separado. Esta actualización se centra en los scripts, la documentación técnica y sus evidencias.

## Configuración privada

El repositorio incluye únicamente plantillas .env.example y scripts/backup.config.example.yml. No publicar contraseñas, cadenas de conexión autenticadas, archivos .env reales, backup.config.yml, volcados, herramientas binarias ni paquetes de entrega con credenciales.

Cada integrante configura su entorno y el acceso de red a Atlas. Los cambios se integran mediante pull requests revisados por el grupo.
