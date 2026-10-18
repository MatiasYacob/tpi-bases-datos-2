# Uso del frontend

Esta guía describe el **prototipo actual**. La navegación cambia la pantalla visible dentro de React; no cambia la URL. Los datos iniciales y todas las modificaciones viven en memoria en `useMockStore`. Por ahora no hay solicitudes HTTP, backend ni base de datos en este recorrido. Al recargar el navegador, vuelven los datos de ejemplo.

## Flujo de pantallas

El menú lateral está disponible desde todas las pantallas. En móvil se abre con el botón del menú y se cierra al elegir una sección.

```mermaid
flowchart TD
    inicio([Abrir la aplicación]) --> resumen[Resumen]
    resumen --> menu[Menú lateral]
    menu --> resumen[Resumen]
    menu --> clientes[Clientes]
    menu --> productos[Productos]
    menu --> pedidos[Pedidos]
    menu --> reportes[Reportes]

    resumen --> resumenVista[Indicadores y pedidos recientes]

    clientes --> clientesLista[Listado, búsqueda y paginación]
    clientesLista --> clienteForm[Crear o editar cliente]
    clienteForm -->|Guardar| clientesLista
    clientesLista --> clienteBaja[Confirmar baja lógica]
    clienteBaja --> clientesLista

    productos --> productosLista[Listado, búsqueda, categoría y paginación]
    productosLista --> productoForm[Crear o editar producto]
    productoForm -->|Guardar| productosLista
    productosLista --> productoBaja[Confirmar baja lógica]
    productoBaja --> productosLista

    pedidos --> pedidosLista[Listado, estado y paginación]
    pedidosLista --> pedidoForm[Crear pedido]
    pedidoForm -->|Guardar| pedidosLista
    pedidosLista --> pedidoDetalle[Ver detalle histórico]
    pedidoDetalle --> pedidoEstado[Cambiar estado permitido]
    pedidoEstado --> pedidosLista
    pedidoDetalle --> pedidoBaja[Confirmar baja lógica]
    pedidoBaja --> pedidosLista

    reportes --> reporteFiltros[Elegir fechas opcionales]
    reporteFiltros --> reporteVista[Ver unidades e importes por categoría]
```

**Resumen** muestra los conteos activos, el importe de pedidos completados y los pedidos recientes. **Clientes** y **Productos** permiten crear, editar y dar de baja; la baja oculta el registro de los listados activos. **Pedidos** permite crear, consultar el detalle, avanzar de estado o dar de baja. Cancelar un pedido es un cambio de estado y no equivale a darlo de baja. **Reportes** agrupa los ítems históricos de pedidos activos y completados, con fechas opcionales.

## Secuencia de uso: crear un pedido y verlo en el reporte

Este ejemplo muestra cómo colaboran las pantallas y el store mock. `App` conserva el estado general y entrega a cada pantalla los datos y operaciones que necesita.

```mermaid
sequenceDiagram
    actor Usuario
    participant Menu as Menú lateral
    participant App
    participant Pedidos as Pantalla Pedidos
    participant Form as Formulario de pedido
    participant Mock as useMockStore
    participant Reportes as Pantalla Reportes

    Usuario->>Menu: Selecciona Pedidos
    Menu->>App: Cambia pantalla activa
    App->>Pedidos: Entrega clientes, productos y pedidos activos
    Usuario->>Pedidos: Pulsa Crear pedido
    Pedidos->>Form: Abre el formulario
    Usuario->>Form: Elige cliente, productos y cantidades
    Form->>Pedidos: Solicita guardar clienteId e ítems
    Pedidos->>Mock: saveOrder(datos)
    Mock->>Mock: Valida referencias, cantidades y productos distintos
    alt Datos válidos
        Mock->>Mock: Copia nombres y precios y calcula subtotales y total
        Mock->>App: Actualiza pedidos en memoria
        Mock-->>Pedidos: Sin error
        App->>Pedidos: Entrega la lista actualizada
        Pedidos-->>Usuario: Cierra formulario y muestra confirmación
    else Datos inválidos
        Mock-->>Pedidos: Devuelve mensaje de error
        Pedidos-->>Usuario: Mantiene formulario y muestra el error
    end

    opt Pedido creado correctamente
        Usuario->>Pedidos: Abre el detalle del pedido
        Pedidos-->>Usuario: Muestra datos históricos y estados permitidos
        loop Primero confirmado, después completado
            Usuario->>Pedidos: Elige un estado permitido
            Pedidos->>Mock: changeStatus(id, nuevoEstado)
            Mock->>App: Actualiza el estado en memoria
            App->>Pedidos: Entrega los pedidos actualizados
        end

        Usuario->>Menu: Selecciona Reportes
        Menu->>App: Cambia pantalla activa
        App->>Reportes: Entrega salesByCategory
        Usuario->>Reportes: Elige fechas opcionales
        Reportes->>Mock: salesByCategory(desde, hasta)
        Mock-->>Reportes: Unidades e importes por categoría
        Reportes-->>Usuario: Muestra gráfico y tabla
    end
```

El formulario enseña un **total estimado** antes de guardar. El mock vuelve a calcularlo al crear el pedido y guarda una copia de los datos del cliente y de cada producto. Por eso el detalle conserva nombres y precios anteriores aunque luego se edite o dé de baja un producto. Un pedido aparece en el reporte cuando está **activo**, tiene estado **completado** y su fecha de creación entra en el período elegido.

## Dónde está implementado

| Parte | Archivo |
| --- | --- |
| Selección de pantalla y composición | [`src/app.tsx`](src/app.tsx) |
| Menú lateral | [`src/components/layout/app-shell.tsx`](src/components/layout/app-shell.tsx) |
| Datos y operaciones del mock | [`src/mocks/data.ts`](src/mocks/data.ts), [`src/mocks/useMockStore.ts`](src/mocks/useMockStore.ts) |
| Pantalla y formulario de pedidos | [`src/pages/orders-page.tsx`](src/pages/orders-page.tsx), [`src/components/forms/order-form.tsx`](src/components/forms/order-form.tsx) |
| Pantalla de reportes | [`src/pages/reports-page.tsx`](src/pages/reports-page.tsx) |
