# Reglas para trabajar en `frontend/`

- Mantener cambios de este módulo dentro de `frontend/`, salvo autorización expresa para tocar otra carpeta.
- Usar React, TypeScript estricto, Vite y componentes shadcn/ui. Conservar los nombres de archivo que genera la CLI de shadcn/ui.
- Nombrar los componentes y páginas propios en `kebab-case.tsx` (`nombre-de-archivo.tsx`). Usar nombres de componentes exportados en PascalCase.
- Guardar constantes compartidas en `src/lib/constants/`. No repetir listas de categorías, estados, rutas o límites en varias vistas.
- Mantener componentes visuales enfocados en presentación e interacción. Poner reglas de negocio, mutaciones y agregaciones del mock en `src/mocks/` o en servicios dedicados; no concentrarlas en `app.tsx`.
- Separar pantallas en `src/pages/`, formularios en `src/components/forms/` y piezas compartidas en `src/components/common/`. Extraer componentes cuando una pieza se repite o tiene una responsabilidad propia.
- Respetar `docs/contrato-api.md` y `docs/guia-integrada.pdf` al conectar el backend: `id` string, fechas ISO UTC, importes en centavos, baja lógica, estados permitidos y respuestas `{data, paginacion}`.
- El navegador no accede a MongoDB Atlas. `VITE_API_URL` es pública; nunca guardar secretos en variables `VITE_` ni versionar `.env` reales.
- Mantener los mocks detrás de una interfaz reemplazable. Al conectar la API, mostrar errores HTTP y fallos de red con mensajes útiles, sin duplicar reglas del servidor en cada página.
- Preservar etiquetas accesibles, foco visible, navegación por teclado, estados vacíos y diseño móvil. Evitar `any` y cálculos de dinero en coma flotante.
- Ejecutar `npm run build` después de cambios de TypeScript o componentes y verificar manualmente los flujos modificados.
