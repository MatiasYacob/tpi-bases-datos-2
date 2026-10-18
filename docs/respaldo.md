# Respaldo y restauracion

## Responsable
Brenda Florencia Romero.
Revisor previsto: Matias Yacob.

## Alcance de esta entrega
Scripts Bash para macOS, probados con MongoDB local.
El campus admite scripts .sh para Linux/Mac.
La adaptacion de la guia interna de PowerShell a Bash debe
comunicarse al grupo antes de integrar.

## Herramientas utilizadas
- mongosh 2.9.2.
- mongodump 100.16.1.
- mongorestore 100.16.1.
- macOS ARM64.

## Archivos
- scripts/backup.sh: crea y valida el respaldo.
- scripts/restaurar-prueba.sh: recupera una copia en una base local aislada.
- scripts/backup.config.example.yml: plantilla sin secretos.
- scripts/backup.config.yml: configuracion privada excluida de Git.
- resguardos_tpi/: copias locales excluidas de Git.

## Preparacion
Desde la raiz del repositorio, copiar la plantilla:
    cp -n scripts/backup.config.example.yml scripts/backup.config.yml

Proteger la configuracion y habilitar los scripts:
    chmod 600 scripts/backup.config.yml
    chmod +x scripts/backup.sh scripts/restaurar-prueba.sh

La plantilla apunta a MongoDB local en el puerto 27017.
MongoDB debe estar funcionando.
No publicar credenciales ni respaldos.

## Respaldo
Comando:
    ./scripts/backup.sh

Entrada: configuracion local y base tpi_tienda.
Salida: resguardos_tpi/AAAA-MM-DD/tpi_tienda/.

El script calcula las rutas desde su ubicacion y evita ejecuciones
simultaneas mediante un bloqueo.
Genera una copia temporal con mongodump, comprueba su codigo de salida
y verifica los BSON y metadatos de clientes, productos y pedidos.
Despues publica la carpeta fechada con una marca de finalizacion.

Si ya existe una copia validada del dia, la omite.
Ante un fallo, no reemplaza copias anteriores.
La presencia de archivos no reemplaza la prueba de restauracion.

mongodump produce un respaldo logico en BSON.
Durante esta prueba local no se realizaron escrituras concurrentes.

## Restauracion local
Comando de la prueba realizada:
    ./scripts/restaurar-prueba.sh 2026-10-18

Entrada: fecha de un respaldo completo.
Destino fijo: tpi_tienda_restore_test en MongoDB local.
Mapeo: tpi_tienda.* -> tpi_tienda_restore_test.*

El script valida los archivos y se detiene si el destino tiene
colecciones. No reemplaza datos existentes ni restaura en tpi_tienda.
Luego consulta conteos y un pedido activo con items.

Ambos scripts devuelven 0 al finalizar correctamente y un codigo
distinto de 0 ante error.

## Pruebas realizadas el 18 de octubre de 2026
Datos ficticios: un cliente, un producto y un pedido completado
con dos unidades del producto.

- Respaldo manual: copia creada con los archivos esperados.
- Repeticion del respaldo: copia del dia omitida correctamente.
- Restauracion: tres documentos recuperados y cero fallos.
- Conteos: un cliente, un producto y un pedido, iguales al origen.
- Pedido: conserva cliente, items y totalCentavos de 300000.
- Destino ocupado: segunda restauracion rechazada sin reemplazar datos.

mongorestore omitio los archivos auxiliares .completo y prelude.json.
Las tres colecciones se recuperaron correctamente.

## Evidencias
Capturas guardadas por separado para incorporar a la entrega:
- 01-datos-locales-antes-del-backup.png
- 02-backup-local-correcto.png
- 03-restauracion-local-correcta.png

## RTO y RPO
Tiempo medido en la prueba local: un segundo desde el inicio de la
restauracion hasta finalizar las consultas del script.
La muestra contiene tres documentos. Este tiempo no representa
el RTO de Atlas ni la recuperacion completa del servicio.

El respaldo actual es manual; no hay un RPO diario garantizado.
Con una tarea diaria exitosa, el RPO objetivo seria de hasta unas
24 horas. Aumentaria ante fallos o ejecuciones omitidas.

## Pendientes
- Prueba de fallo de conexion.
- Programacion diaria y verificacion en macOS.
- Respaldo remoto de Atlas con configuracion protegida.
- Configuracion de permisos de restauracion en Atlas.
- Verificacion de datos reales, bajas logicas y reporte.
- Medicion de recuperacion con datos del grupo.
- Incorporacion de capturas y revision cruzada.

## Requisitos para integrar con Atlas
- Configuracion de conexion y permisos adecuados.
- IP del equipo autorizada en Network Access.
- Datos de prueba y conteos originales para verificar la recuperacion.

El respaldo funciona independientemente de Express y del frontend.
Las credenciales reales deben mantenerse fuera del repositorio.

## Actualizacion de pruebas locales: 18 de octubre de 2026
- Reemplazo con --forzar: nueva copia validada antes de sustituir
  la anterior. Resultado correcto y codigo de salida 0.
- Ejecucion normal con copia existente: omision y codigo 0.
- Retencion: probada en un directorio temporal separado con seis
  copias de fechas simuladas y una copia nueva del dia.
  Se conservaron las cinco fechas completas mas recientes.
  La carpeta incompleta y el archivo notas.txt quedaron intactos.
- Interrupcion manual: codigo 130. Las huellas SHA-256 confirmaron
  que todos los archivos anteriores permanecieron iguales.
- Configuracion invalida: fallo automatico con codigo 1.
  Las huellas SHA-256 confirmaron que los archivos anteriores
  permanecieron iguales.
- La prueba de fallo de conexion de red sigue pendiente:
  el intento se interrumpio manualmente y no cuenta como prueba
  de terminacion automatica ante fallo de red.

Uso adicional:
    ./scripts/backup.sh --forzar

La retencion se ejecuta despues de publicar una copia nueva.
Las fechas simuladas se utilizaron solo para probar la retencion;
no representan respaldos realizados en dias anteriores.
