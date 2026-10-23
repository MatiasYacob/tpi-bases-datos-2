from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

root=Path(__file__).resolve().parents[1]
out=root/'output/pdf';out.mkdir(parents=True,exist_ok=True)
fonts=Path('C:/Windows/Fonts')
if not (fonts/'segoeui.ttf').exists(): raise RuntimeError('Se requiere Segoe UI para generar esta version')
pdfmetrics.registerFont(TTFont('PendingBody',str(fonts/'segoeui.ttf')))
pdfmetrics.registerFont(TTFont('PendingHead',str(fonts/'segoeuib.ttf')))
navy=colors.HexColor('#17334B');teal=colors.HexColor('#007D86')
styles={
 'title':ParagraphStyle('title',fontName='PendingHead',fontSize=24,leading=30,textColor=navy,spaceAfter=10),
 'sub':ParagraphStyle('sub',fontName='PendingBody',fontSize=10,leading=14,textColor=teal,spaceAfter=14),
 'head':ParagraphStyle('head',fontName='PendingHead',fontSize=12,leading=16,textColor=teal,spaceBefore=11,spaceAfter=6),
 'body':ParagraphStyle('body',fontName='PendingBody',fontSize=10,leading=14,spaceAfter=8,textColor=navy),
 'code':ParagraphStyle('code',fontName='Courier',fontSize=9,leading=13,backColor=colors.HexColor('#EFF4F7'),borderPadding=8,spaceBefore=4,spaceAfter=12),
}
def p(text,style='body'): return Paragraph(escape(text),styles[style])
def heading(text):return p(text,'head')
def make(name,pages):
 story=[]
 for i,page in enumerate(pages):
  if i:story.append(PageBreak())
  story.extend(page)
 def footer(canvas,doc):
  canvas.setStrokeColor(teal);canvas.line(48,A4[1]-34,A4[0]-48,A4[1]-34)
  canvas.setFont('PendingBody',8);canvas.setFillColor(navy)
  canvas.drawString(48,25,'TPI Bases de Datos 2 | Pendientes al 23/10/2026')
  canvas.drawRightString(A4[0]-48,25,str(doc.page))
 SimpleDocTemplate(str(out/name),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=51,bottomMargin=47,
   title=name.replace('.pdf','').replace('-',' '),author='Equipo TPI Bases de Datos 2').build(story,onFirstPage=footer,onLaterPages=footer)

make('pendientes-javier.pdf',[
 [
  p('Pendientes de Javier','title'),p('Frontend y revisión independiente del backend','sub'),
  heading('Punto de partida'),
  p('La aplicación ya está conectada a la API y Atlas. Las evidencias de índices y de integración están integradas en main mediante el PR #4. No hace falta rehacer el frontend: falta ejecutar una revisión propia y dejar sus resultados.'),
  heading('1. Actualizar y preparar el entorno'),
  p('Desde una copia sin cambios pendientes, actualizar main con git pull --ff-only. Usar Node 24. Entrar a backend y ejecutar npm ci. Registrar el commit revisado con git rev-parse --short HEAD.'),
  heading('2. Ejecutar las pruebas aisladas'),
  p('Dentro de backend, ejecutar uno por uno:'),
  Paragraph('npm test<br/>npm run evidence:integration<br/>npm run evidence:indexes',styles['code']),
  p('Resultado esperado: 10 pruebas en npm test; 48 solicitudes HTTP y 4 comprobaciones MongoDB en integración. En índices: tres consultas conservan resultados/orden y examinan menos documentos; el caso sin categoría mantiene SORT.'),
  p('Estas pruebas usan MongoDB temporal local: no requieren .env ni credenciales de Atlas. El primer uso puede descargar MongoDB 7.0.24. Los comandos de evidencia regeneran JSON y documentos; revisar el diff antes de subir archivos.'),
  heading('3. Revisar la interfaz con la base compartida'),
  p('Coordinar con Matías. Configurar backend/.env por privado, iniciar backend con npm start y frontend con npm ci y npm run dev. Abrir http://localhost:5173.'),
  p('Crear un cliente y producto ficticios identificables; crear un pedido; comprobar total del servidor, historial al editar el catálogo, estados y reporte. Probar email duplicado, bajas lógicas y persistencia al recargar.')
 ],
 [
  p('Evidencias y cierre','title'),p('Qué entregar para completar la revisión','sub'),
  heading('4. Comprobar comportamiento y accesibilidad'),
  p('Revisar mensajes de carga, listas vacías y errores de red/HTTP. Confirmar que un error no cierre el formulario ni borre lo escrito. Probar búsqueda, filtros y paginación. Revisar móvil, etiquetas de campos, foco y uso con teclado.'),
  p('Comprobar el comportamiento sin backend y que Reintentar carga recupere los datos al volver a iniciarlo. Al finalizar, dar de baja solo los registros ficticios propios, sin borrar documentos ajenos.'),
  heading('5. Dejar registro independiente'),
  p('Completar docs/revision-cruzada.md cuando esté disponible en GitHub, o entregar una ficha equivalente. Incluir fecha, sistema operativo, versión de Node, commit revisado, salida de comandos y flujos de interfaz realmente ejecutados.'),
  p('Anotar cada problema con pasos para reproducir, resultado esperado y resultado obtenido. Terminar con un veredicto: aprobado, aprobado con observaciones o requiere cambios. La ejecución anterior del autor no reemplaza esta revisión.'),
  heading('6. Capturas para el informe'),
  p('Entregar capturas legibles de listado y formulario, pedido con detalle histórico, error de validación y reporte. Incluir resultados de pruebas o logs sanitizados. No mostrar contraseñas, URI con credenciales ni .env.'),
  heading('Criterio para dar tu parte por cerrada'),
  p('Los tres comandos se ejecutaron en tu equipo, los flujos quedaron verificados, las observaciones están registradas y la aprobación es tuya. El grupo puede usar esa evidencia en el informe y la defensa.'),
  heading('Preguntas para ensayar'),
  p('¿Por qué el navegador no usa la URI de Atlas? ¿Por qué el total definitivo lo calcula el servidor? ¿Por qué cambiar un producto no cambia el pedido anterior? ¿Qué distingue COLLSCAN, IXSCAN y SORT?'),
  heading('Archivos de referencia'),
  p('docs/pruebas-integracion.md; docs/evidencias/integracion/http.json; docs/evidencias/indices/README.md; frontend/README.md; docs/contrato-api.md.'),
  p('Estado de este documento: guía de tareas; no certifica que la revisión de Javier ya se haya realizado.')
 ]
])

make('pendientes-brenda.pdf',[
 [
  p('Pendientes de Brenda','title'),p('Cierre de respaldo, recuperación y evidencias','sub'),
  heading('Punto de partida'),
  p('Los scripts y pruebas locales de respaldo, retención, fallos, programación y restauración ya están publicados. No se pide rehacerlos. Estos pendientes se basan en la última documentación de main: si ya los completaste en tu equipo, basta publicar los cambios y resultados reales.'),
  heading('1. Confirmar el estado real'),
  p('Actualizar main y contrastar docs/respaldo.md con tu configuración de ejecución. Indicar si el respaldo sigue apuntando a MongoDB local o ya usa Atlas. Confirmar si la tarea diaria está pausada o activa y en qué equipo se ejecuta.'),
  heading('2. Probar la corrección de restauración'),
  p('El PR #5 ya corrigió restaurar-prueba.sh y está en main. Pasaron seis pruebas de regresión de la lógica. Actualizar los scripts de la carpeta de ejecución en macOS antes de probar.'),
  p('El script ahora compara primero los conteos y comprueba un pedido sin exigir activo=true; acepta cero si coincide con el respaldo. Repetir la restauración real con pedidos activos, todos inactivos y ningún pedido, registrando los resultados.'),
  heading('3. Completar respaldo real desde Atlas'),
  p('Configurar la conexión protegida al clúster TPI-Tienda, base tpi_tienda, con tu usuario. Coordinar con Matías una pausa de escrituras y registrar conteos del origen asociados a esa copia. No subir secretos ni volcados a GitHub.'),
  p('Ejecutar backup.sh y verificar código 0, carpeta fechada, los tres BSON/metadatos y marca de finalización. Registrar fecha, herramienta, base de origen y evidencia sanitizada. La copia debe servir con Express detenido.'),
  heading('4. Asociar los conteos correctos'),
  p('El restaurador requiere conteos-esperados.json, pero backup.sh todavía no lo genera. Documentar o automatizar su creación junto con la copia. Al usar --forzar, asegurar que el archivo corresponda a la nueva copia; no usar conteos actuales para representar un respaldo antiguo.')
 ],
 [
  p('Recuperación y entrega','title'),p('Pruebas que cierran el módulo','sub'),
  heading('5. Restaurar la copia de Atlas en destino aislado'),
  p('Probar el flujo actualizado completo contra tpi_tienda_restore_test, separado de tpi_tienda. Restaurar un respaldo de Atlas a una base local de prueba es válido si se documentan origen y destino. No reemplazar un destino ocupado sin autorización.'),
  p('Comprobar conteos, pedido con ítems, nombres/precios históricos, bajas lógicas y reporte. Registrar inicio, fin y RTO hasta que las consultas sean correctas. Coincidir en cantidad no demuestra por sí solo igualdad de contenido.'),
  heading('6. Cerrar la programación diaria'),
  p('Confirmar TPI-Tienda-Backup con launchd, horario definitivo, rutas absolutas, PATH y configuración correctos. La última documentación dice que la tarea quedó pausada. Activarla en el equipo acordado y comprobar una ejecución por horario, con la app detenida.'),
  p('Verificar o documentar qué ocurre con horarios perdidos y suspensión. El equipo debe tener red y disco disponible. Repetir la programación no debe duplicar la tarea. Si está activa contra Atlas, dejar evidencia y actualizar el estado publicado.'),
  heading('7. Mantener las pruebas ya realizadas'),
  p('Conservar las evidencias de retención de cinco copias, reemplazo seguro con --forzar, bloqueo y fallo de conexión sin pérdida. Al cambiar de local a Atlas, comprobar acceso/red y que las copias anteriores se conserven ante fallo. No simular fechas como si fueran respaldos históricos reales.'),
  heading('8. Actualizar y entregar evidencia'),
  p('Actualizar docs/respaldo.md con configuración general sin secretos, comandos reproducibles, resultados reales y pendientes resueltos. Adjuntar capturas/logs sanitizados y el RTO medido. Explicar RPO objetivo de hasta unas 24 horas solo si la tarea diaria funciona; aumenta si se omiten ejecuciones.'),
  p('Como revisión cruzada del frontend, comprobar el recorrido básico y registrar observaciones propias. Coordinar la revisión de tu módulo con Matías y aportar al informe los resultados finales.'),
  heading('Criterio de cierre'),
  p('Respaldo real de Atlas creado; restauración completa y consultas verificadas; tarea y RPO documentados; evidencias publicadas; revisión de Matías registrada. Si algo ya está hecho pero no publicado, actualizar la documentación para que el grupo pueda comprobarlo.')
 ]
])
print(out/'pendientes-javier.pdf')
print(out/'pendientes-brenda.pdf')
