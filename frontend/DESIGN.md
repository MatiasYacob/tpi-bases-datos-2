# Guía de estilos · TPI Tienda

## Dirección visual

El frontend conserva la identidad del mockup HTML: una herramienta de gestión oscura, con navegación lateral azul noche, superficies elevadas discretas y acentos lavanda. La interfaz prioriza leer tablas, completar formularios y distinguir estados de pedido. Todo dato inicial es ficticio y la insignia «Modo demostración · Mocks» lo indica.

## Tokens

Los tokens de shadcn/ui están definidos en `src/index.css` y se aplican mediante la clase `dark` del documento. No fijar colores nuevos en cada componente si existe un token.

| Uso | Token / valor | Aplicación |
| --- | --- | --- |
| Fondo | `--background: #0b1020` | Lienzo principal |
| Navegación | `--sidebar: #10182b` | Barra lateral |
| Superficie | `--card: #151f34` | Tarjetas, tablas y paneles |
| Acento | `--primary: #8b9eff` | Acción principal y foco |
| Texto | `--foreground: #e8edf8` | Contenido principal |
| Texto secundario | `--muted-foreground: #a5b4ce` | Ayudas y metadatos |
| Borde | `--border: #293751` | Separación de superficies |
| Radio | `--radius: .75rem` | Componentes shadcn/ui |

Estados de pedido: pendiente azul grisáceo, confirmado ámbar, completado verde y cancelado rojo. El color acompaña siempre una etiqueta legible; nunca es la única señal.

## Tipografía y espaciado

- Familia: Geist Variable, instalada localmente por la configuración de shadcn/ui. Respaldo: sans-serif.
- Título de página: 26–32 px, peso 750. Título de panel: 18 px, peso 650. Texto de tablas y formularios: 14 px.
- Cifras monetarias con `font-variant-numeric: tabular-nums`; mostrar ARS desde centavos enteros.
- Separación base de controles: 8–16 px. Paneles y tarjetas: 20 px de relleno en escritorio; 13–15 px en móvil.
- El foco visible usa el anillo lavanda. La selección de texto y las barras de desplazamiento siguen la misma paleta.

## Componentes y patrones

- Los controles base se generan con shadcn/ui y conservan sus nombres de archivo originales en `src/components/ui/`.
- Los componentes propios viven en `src/components/` con archivos `kebab-case.tsx`.
- `PageHeader`, `Metric`, `OrderTable`, `StatusBadge`, `Pager` y `ConfirmDeactivateDialog` se reutilizan.
- Tablas: encabezado discreto, filas con separación fina y desplazamiento horizontal cuando el ancho es insuficiente.
- Formularios: etiquetas explícitas, errores junto al formulario y confirmación al guardar.
- Diálogos: para editar, crear, ver detalle y confirmar baja. La cancelación de un pedido y su baja lógica son acciones distintas.
- Estados vacíos: texto directo que explica la ausencia de resultados; filtros y paginación permanecen disponibles.

## Adaptación

- Escritorio: barra lateral de 240 px con desplazamiento propio, separado del contenido principal; cuatro métricas en una fila.
- Tableta: barra lateral compacta de 72 px; métricas en dos columnas.
- Móvil (hasta 600 px): menú lateral desplegable, contenido a 15 px del borde y tablas desplazables. Los formularios mantienen controles táctiles de al menos 40 px.

## Contenido y comportamiento

- Usar español claro y nombres de categorías legibles, aunque los valores enviados a la API permanezcan sin acentos (`tecnologia`, `libreria`, `hogar`).
- Mostrar los valores históricos guardados en el pedido, no los del catálogo actual.
- Los totales visuales del formulario de pedido son estimativos. La API será la autoridad al integrar el backend.
- Los mocks se reinician al recargar. La insignia de demostración debe permanecer visible mientras se usen.
