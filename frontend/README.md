# Frontend · TPI Tienda

Prototipo de tienda desarrollado con React, TypeScript, Vite, Tailwind CSS y shadcn/ui a partir del mockup HTML del equipo. Funciona con datos ficticios en memoria; al recargar, vuelve al estado inicial. La integración con la API Express está pendiente.

## Requisitos

| Herramienta | Para qué se usa |
| --- | --- |
| [Node.js](https://nodejs.org/en/download) | Ejecutar Vite. Se necesita una versión compatible: **20.19+ o 22.12+**, según la [guía de Vite](https://vite.dev/guide/). |
| npm | Instalar las dependencias y ejecutar los comandos del proyecto. Viene con la instalación habitual de Node.js; no hace falta instalar Vite globalmente. |
| IDE o editor | Recomendado para modificar código: Visual Studio Code u otro editor con soporte para TypeScript. No es necesario para levantar el servidor. |
| Navegador web | Abrir la aplicación localmente. |

Comprobá que Node.js y npm estén disponibles en la terminal:

```powershell
node --version
npm --version
```

## Levantar el servidor de desarrollo

Desde la **raíz del repositorio**, ejecutá:

```powershell
cd frontend
npm ci
npm run dev
```

`npm ci` instala las versiones registradas en `package-lock.json`. Cuando Vite indique que está listo, abrí **http://localhost:5173/**. Si ese puerto está ocupado, usá la dirección `Local` que Vite muestre en la terminal. Mantené la terminal abierta mientras uses la aplicación y detené el servidor con `Ctrl+C`.

El prototipo usa mocks en memoria: **no necesita levantar el backend ni configurar `.env`**. Los datos vuelven al estado inicial al recargar la página.

Para comprobar la compilación de producción, ejecutá `npm run build` desde `frontend/`. El comando `npm run preview` permite ver localmente esa compilación.

## Estructura

| Ruta | Responsabilidad |
| --- | --- |
| `src/app.tsx` | Composición de secciones y estado de navegación |
| `src/pages/` | Pantallas de resumen, clientes, productos, pedidos y reportes |
| `src/components/ui/` | Componentes generados por shadcn/ui |
| `src/components/common/` | Piezas visuales reutilizables |
| `src/components/forms/` | Formularios de entidades y pedidos |
| `src/components/orders/` | Detalle histórico del pedido |
| `src/mocks/` | Datos de demostración y reglas de negocio del mock |
| `src/lib/constants/` | Categorías, estados, navegación y paginación |

La [guía de uso](USO.md) incluye un diagrama de secuencia y un flujo de pantallas. La [guía de estilos](DESIGN.md) registra colores, tipografía y patrones. Las [reglas de trabajo](AGENTS.md) establecen convenciones para los siguientes cambios.

## Alcance del prototipo

- Listados, filtros y paginación de clientes, productos y pedidos.
- Altas y edición de clientes y productos, con baja lógica.
- Creación de pedidos, detalle con datos históricos y cambios válidos de estado.
- Reporte de ventas por categoría con filtro de fechas.
- Validaciones básicas y mensajes de éxito/error en los formularios.

Los identificadores mock tienen formato de 24 caracteres hexadecimales para ser compatibles con el contrato de la API. La implementación actual no realiza solicitudes HTTP. `VITE_API_URL` está preparada en `.env.example` para la integración posterior.
