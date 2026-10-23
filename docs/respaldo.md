# Respaldo y restauracion

## Responsable
Brenda Florencia Romero.
Revisor previsto: Matias Yacob.

## Alcance de esta entrega
Scripts Bash para macOS probados con MongoDB local y respaldo remoto
de Atlas. El 23/10/2026 se respaldo tpi_tienda desde el cluster del TPI
y se restauro en tpi_tienda_restore_test de MongoDB local.

Se recuperaron 22 documentos sin fallos. Se comprobaron conteos,
registros inactivos, datos historicos de pedidos, calculos y reporte.
La tarea launchd esta activa en la Mac de Brenda a las 02:00,
hora local. Se verifico una ejecucion por horario contra Atlas.

El campus admite scripts .sh para Linux/Mac.
Las secciones fechadas anteriores describen pruebas historicas;
el estado actual es el indicado aqui y en el cierre del 23/10/2026.

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
Luego compara conteos y consulta un pedido con items, activo o inactivo.
Si no hay pedidos y el conteo esperado es cero, no exige un documento.

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
El 23/10/2026 el script midio 1 segundo desde el inicio de la
restauracion hasta terminar sus consultas y comparacion de conteos.
La copia provenia de Atlas y contenia 22 documentos.
Las validaciones manuales posteriores de bajas logicas, historial
y reporte no estan incluidas en ese tiempo.
No se midio un RTO integral hasta finalizar todas esas validaciones.

La tarea diaria esta activa a las 02:00 y fue probada por horario.
El RPO objetivo es de hasta unas 24 horas si las ejecuciones
diarias se completan correctamente. No es una garantia: aumenta
ante fallos, equipo apagado o ejecuciones omitidas.

## Pendientes
- Confirmar una pausa coordinada de escrituras para la prueba final
  y registrar que Express este detenido.
- Completar la revision del frontend y registrar observaciones.
- Registrar la revision del modulo por Matias.
- Incorporar los resultados finales y mantener reproducibles los
  comandos de validacion.
- Verificar por horario la version con conteos automaticos; la
  ejecucion por horario anterior y la version nueva manual ya fueron probadas.

Resuelto el 23 de octubre de 2026:
- Conteos automaticos obtenidos de los BSON de cada nueva copia.
- Documentacion de suspension, apagado y horarios perdidos.
- Restauracion de la nueva copia: 22 documentos y validaciones
  completadas en 2 segundos. No incluye levantar la aplicacion.

La restauracion probada fue local y no requiere permisos de escritura
sobre Atlas. La pausa de escrituras aun no fue confirmada.
No se afirma que el respaldo sea una instantanea transaccional global.

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
- El primer ensayo de conexion se interrumpio manualmente.
  La prueba local se completo el 19 de octubre de 2026;
  consultar el resultado documentado mas adelante.

Uso adicional:
    ./scripts/backup.sh --forzar

La retencion se ejecuta despues de publicar una copia nueva.
Las fechas simuladas se utilizaron solo para probar la retencion;
no representan respaldos realizados en dias anteriores.

## Programacion en macOS y punto de pausa
Se implemento scripts/programar-backup.sh usando launchd.
La tarea se llama TPI-Tienda-Backup y utiliza rutas absolutas.
El PATH incluye la ubicacion instalada de mongodump.

macOS bloqueo la ejecucion desde el Escritorio.
Se preparo una copia de ejecucion en:
    ~/TPI-Tienda-Backup/scripts/

Esta carpeta contiene backup.sh, programar-backup.sh y la
configuracion privada. Sus respaldos y logs quedan en:
    ~/TPI-Tienda-Backup/resguardos_tpi/

El repositorio principal permanece en el Escritorio.
Los cambios posteriores deben copiarse a la carpeta de ejecucion.
La configuracion sigue apuntando a MongoDB local, no a Atlas.

Pruebas realizadas:
- Registro inicial a las 02:00 y respaldo al cargar: codigo 0.
- Reprogramacion temporal a las 15:26.
- Ejecucion por horario a las 15:26:05: copia existente omitida.
- Estado consultado: runs = 2 y last exit code = 0.
No se ha verificado todavia una ejecucion nocturna ni la
recuperacion de horarios perdidos durante suspension o apagado.

Pausa:
La tarea se descargo con launchctl bootout y su archivo se movio
fuera de LaunchAgents para evitar que se cargue al iniciar sesion.
Los datos, respaldos y scripts se conservan.

Para reactivar a las 02:00, con MongoDB local disponible:
    /bin/bash "$HOME/TPI-Tienda-Backup/scripts/programar-backup.sh" 02:00

Pendientes al retomar:
- Actualizar las secciones anteriores de estado y pendientes.
- Completar pruebas de recuperacion y errores de acceso a Atlas.
- Completar instalacion reproducible y evidencias.
- Integrar y probar contra Atlas.

## Pruebas adicionales del 19 de octubre de 2026
- Ejecucion desde la carpeta de usuario: el script genero el respaldo
  del 19 de octubre dentro del proyecto y termino con codigo 0.
  Se comprobo que las rutas no dependen del directorio actual.
- Bloqueo ocupado simulado: se creo previamente .backup.lock.
  El script rechazo la ejecucion con codigo 1.
  Esta prueba no representa dos procesos reales simultaneos.
- Se retiro el bloqueo de ensayo y se repitio la ejecucion:
  la copia existente del dia se omitio correctamente con codigo 0.

Evidencias previstas:
- 10-backup-desde-otra-carpeta.png
- 11-bloqueo-ocupado.png

## Prueba de conexion fallida del 19 de octubre de 2026
Se ejecuto una copia del script en un directorio temporal separado,
con una copia del respaldo existente y conexion a 127.0.0.1:1.
Antes de la prueba se comprobo que ese puerto estaba cerrado.

El intento termino automaticamente en aproximadamente 31 segundos,
sin intervencion manual. El script y la herramienta devolvieron
codigo 1. La comparacion SHA-256 antes y despues no encontro
diferencias: todos los archivos anteriores permanecieron intactos.

El limitador externo de 10 segundos utilizado en el ensayo no fue
efectivo. No se incorpora al script del proyecto ni se considera
una garantia de tiempo maximo.

Evidencia prevista:
- 12-fallo-conexion-sin-perdida.png

Esta prueba completa el caso local de conexion fallida.
Queda pendiente verificar los errores de acceso y red de Atlas.

## Instalacion reproducible en macOS
El script scripts/instalar-macos.sh instala o actualiza backup.sh,
restaurar-prueba.sh y programar-backup.sh en:
    ~/TPI-Tienda-Backup/scripts/

Comando desde el repositorio:
    ./scripts/instalar-macos.sh

Antes de instalar comprueba la sintaxis de los scripts y que
la tarea TPI-Tienda-Backup no este cargada.
Compara los scripts instalados con los originales.
Conserva la configuracion privada existente. Si no existe,
copia la configuracion local del proyecto con permisos 600.
No activa la tarea ni modifica los respaldos existentes.

Cada cambio en los scripts del repositorio requiere volver
a ejecutar el instalador, con la tarea pausada.
Los cambios de conexion deben aplicarse expresamente a la
configuracion de ejecucion: el instalador no la sobrescribe.

Pruebas del 19 de octubre de 2026:
- Instalacion y comparacion de los tres scripts: codigo 0.
- Reinstalacion: codigo 0.
- Configuracion privada: misma huella SHA-256 antes y despues.

El restaurador instalado utiliza los respaldos de la carpeta
de ejecucion y sigue conectado exclusivamente a MongoDB local.

Evidencia prevista:
- 13-instalacion-macos.png

## Registro repetido sin duplicados: 19 de octubre de 2026
Se registro TPI-Tienda-Backup a las 02:00 y se volvio a registrar
con el mismo nombre y horario.
Despues del segundo registro, launchctl list mostro una sola tarea.
La ejecucion al cargar termino con codigo 0 y omitio correctamente
el respaldo existente del dia.

Al finalizar se descargo la tarea y se movio el plist fuera de
LaunchAgents. Se verificaron cero tareas cargadas y ausencia
del archivo de inicio automatico.

Evidencia prevista:
- 14-registro-sin-duplicados.png

## Comparacion automatica de conteos: 19 de octubre de 2026
Se agrego scripts/verificar-conteos.sh.
Lee conteos-esperados.json de la carpeta fechada y compara
clientes, productos y pedidos con tpi_tienda_restore_test local.

Comando:
    ./scripts/verificar-conteos.sh 2026-10-19

Preparacion realizada sin escrituras concurrentes:
1. Consultar y guardar los conteos del origen antes del respaldo.
2. Ejecutar el backup con --forzar.
3. Tras el exito, copiar esos conteos a la carpeta de la copia
   con el nombre conteos-esperados.json.

Los conteos se registraron manualmente mediante mongosh;
backup.sh todavia no genera ese archivo automaticamente.
Un nuevo respaldo forzado sustituye la carpeta y requiere
volver a registrar los conteos correspondientes.
Nunca usar conteos actuales para representar una copia antigua
si los datos cambiaron desde que fue creada.

Pruebas:
- Valores esperados 1/1/1 contra la base de prueba existente:
  coincidencia y codigo 0.
- Valores de ensayo 2/1/1 en carpeta temporal:
  diferencia detectada en clientes y codigo 1.
- Estas pruebas solo consultaron datos, sin modificarlos.
- No se realizo una nueva restauracion del respaldo del dia.

Integracion:
El restaurador exige el archivo de conteos y llama al verificador
antes de informar exito. Las copias sin ese archivo se rechazan.
La sintaxis se comprobo; falta probar el flujo completo actualizado
en un destino de prueba vacio o reemplazado con autorizacion.

El instalador ahora incluye cuatro scripts.
La actualizacion termino con codigo 0 y conservo la configuracion.
Los conteos y respaldos del repositorio no se copian al despliegue;
cada restauracion requiere su copia y archivo de conteos asociados.

Coincidir en cantidad no demuestra igualdad de contenido.
Quedan pendientes las validaciones de negocio y la prueba con Atlas.

Evidencias previstas:
- 15-conteos-coincidentes.png
- 16-conteos-diferentes.png

## Correccion de validacion de restauracion - 23 de octubre de 2026
Se corrigio restaurar-prueba.sh para no exigir pedidos activos.
La comparacion de conteos de la copia ocurre primero; si falla, set -e
detiene el flujo. Si habia pedidos, se revisa uno sin filtrar activo.
Si el conteo esperado y recuperado de pedidos es cero, se acepta sin
buscar un documento inexistente. Un pedido encontrado sin items se rechaza.
La proteccion del destino y el proceso mongorestore no se modificaron.

Pruebas de regresion: desde backend, npm test. Se agregan seis casos que
ejecutan las expresiones mongosh de los scripts con respuestas de DB simuladas:
pedido activo, todos inactivos, cero pedidos, items vacios, orden de
verificacion y discrepancia de conteos. Esto verifica la logica, no una
restauracion real ni la ejecucion en macOS. La sintaxis Bash se comprueba
por separado. Brenda debe repetir el flujo real con sus herramientas.

La modificacion no altera copias, Atlas ni bases locales existentes.
Reinstalar la version corregida en la carpeta de ejecucion de macOS antes
de repetir el ensayo. Mantener el archivo conteos-esperados.json asociado
a su respaldo.

## Cierre de pruebas con Atlas - 23 de octubre de 2026

### Configuracion y origen
Equipo: Mac de Brenda, macOS ARM64.
Carpeta de ejecucion: ~/TPI-Tienda-Backup/.
Origen: cluster tpi-tienda.h0wuken.mongodb.net, base tpi_tienda.
La configuracion privada de ejecucion usa Atlas y permisos 600.
Las credenciales y los volcados se mantienen fuera de Git.
La configuracion privada del repositorio no fue actualizada en esta prueba.

### Respaldo manual verificado
Conteos previos consultados en Atlas a las 14:27:50 UTC:
clientes 4, productos 11, pedidos 7.
Respaldo iniciado a las 10:30:07 y finalizado a las 10:30:12,
hora local de Toronto. Codigo de salida 0.
Se verificaron los tres BSON, sus metadatos y la marca .completo.
Se agrego conteos-esperados.json con los valores previos.

Esta copia fue restaurada y luego preservada en:
~/TPI-Tienda-Backup/resguardos_tpi/copias-previas/antes-horario-Rl88wQ/2026-10-23/

La pausa de escrituras no se confirmo con el grupo.
Las consultas posteriores coinciden, pero no prueban ausencia
de modificaciones concurrentes durante el respaldo.

### Restauracion y verificaciones
Destino: MongoDB local, base tpi_tienda_restore_test.
La base de prueba anterior se elimino con autorizacion explicita.
No se elimino ni restauro sobre la base original de Atlas.
La restauracion recupero 22 documentos sin fallos y restauro indices.
El script termino con codigo 0 y midio 1 segundo hasta sus consultas.

Conteos comprobados en origen y destino:
- Clientes: 4 totales, 2 activos y 2 inactivos.
- Productos: 11 totales, 9 activos y 2 inactivos.
- Pedidos: 7 totales, 5 activos y 2 inactivos.

Los siete pedidos superaron la comprobacion de presencia de datos
historicos y coherencia de subtotales y totales.
Esto no constituye una comparacion campo por campo con el origen.

El reporte de pedidos activos y completados coincidio entre la
base restaurada y Atlas consultado despues de la restauracion:
- hogar: 3 unidades, 90000 centavos.
- libreria: 5 unidades, 250000 centavos.

### Ejecucion por horario
TPI-Tienda-Backup se programo temporalmente a las 10:46.
La ejecucion inicio a las 10:46:05 y termino a las 10:46:09.
Genero una nueva copia desde Atlas; codigo final 0, sin errores
en el registro consultado. No fue una simple omision.

Despues se restablecio el horario diario a las 02:00.
Se verifico una sola tarea cargada, rutas absolutas y PATH
con /opt/homebrew/bin.

La copia automatica nueva ocupa resguardos_tpi/2026-10-23/.
No tiene conteos-esperados.json asociado y no fue restaurada.
No debe confundirse con la copia manual preservada y verificada.
Las carpetas de reserva quedan fuera de la retencion por fecha
de la raiz y requieren gestion separada.

### Evidencias previstas para incorporar
- 17-atlas-colecciones-conteos.png
- 18-atlas-conteos-previos.png
- 19-backup-atlas-correcto.png
- 20-restauracion-atlas-a-local.png
- 21-restauracion-bajas-logicas.png
- 22-reporte-datos-restaurados.png
- 23-pedidos-historicos-verificados.png
- 24-comparacion-origen-atlas.png
- 25-backup-atlas-por-horario.png
- 26-programacion-diaria-atlas.png

Los nombres anteriores son una lista prevista.
Solo se consideran adjuntas las evidencias efectivamente publicadas.

## Conteos automaticos desde BSON - 23 de octubre de 2026
Se incorporo scripts/generar-conteos.sh al respaldo y al instalador
de macOS. Requiere bsondump, incluido en MongoDB Database Tools.

El auxiliar procesa los BSON de clientes, productos y pedidos con
bsondump --objcheck y genera conteos-esperados.json dentro de la
copia temporal, antes de publicar el respaldo y su marca .completo.
Los conteos corresponden a los documentos del volcado, no a una
consulta posterior del origen. No sustituyen una comparacion de
contenido ni garantizan consistencia entre colecciones bajo
escrituras concurrentes.

Pruebas locales en una carpeta temporal:
- Generacion automatica: conteos 1/1/1 y codigo 0.
- Reemplazo con --forzar: valores ficticios 999/999/999 reemplazados
  por los conteos reales 1/1/1.
- Auxiliar ausente: codigo 1 y respaldo anterior intacto, comprobado
  mediante comparacion SHA-256.

Se actualizo la instalacion conservando la configuracion privada.
La tarea se reactivo a las 02:00 y se verifico una sola instancia
registrada.

Prueba manual con Atlas: 11:25:05 a 11:25:10, codigo 0.
La nueva copia genero automaticamente conteos 4/11/7.
El verificador coincidio con la restauracion local anterior;
esta nueva copia todavia no fue restaurada.

La copia automatica de las 10:46 se conservo antes del reemplazo en:
~/TPI-Tienda-Backup/resguardos_tpi/copias-previas/antes-conteos-auto-cchLp5/2026-10-23/

Esta actualizacion resuelve la generacion de conteos para nuevas
copias. Las copias antiguas no se modifican automaticamente.
La ejecucion por horario de esta version actualizada aun no fue
verificada.

## Suspension, apagado y horarios perdidos
La tarea TPI-Tienda-Backup usa StartCalendarInterval a las 02:00,
hora local, y RunAtLoad. Esta instalada como LaunchAgent del usuario.

Comportamiento esperado segun la documentacion de Apple:
- En suspension: una ejecucion pendiente por calendario se intenta
  al despertar. Varios horarios perdidos se agrupan en un intento.
- Con el equipo apagado: no se ejecuta el respaldo a la hora prevista.
  No se recupera cada horario perdido.
- Al iniciar sesion: RunAtLoad provoca un intento cuando se carga
  el agente. Si ya existe una copia completa del dia, se omite.
- Sin sesion del usuario iniciada, no se cuenta con este LaunchAgent
  para realizar el respaldo.

El intento requiere red, IP autorizada en Atlas, credenciales validas,
herramientas disponibles y espacio en disco. La tarea no configura
reintentos inmediatos ante fallos de conexion.

Estas condiciones describen el comportamiento esperado.
No se probaron suspension, apagado ni recuperacion de horarios
perdidos en este equipo. La ejecucion por horario con el equipo
disponible si fue comprobada.

El RPO objetivo es de hasta unas 24 horas si las copias diarias
terminan correctamente. Aumenta cuando hay fallos o ejecuciones
omitidas; no es una garantia incondicional.

Referencia:
https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html

## Restauracion de copia con conteos automaticos y tiempo medido
El 23 de octubre de 2026 se restauro la copia de Atlas generada
a las 11:25, con conteos-esperados.json obtenido de sus BSON.
Destino: MongoDB local, tpi_tienda_restore_test.
El destino anterior se elimino con autorizacion explicita.

Se recuperaron 22 documentos sin fallos y se restauraron indices.
Los conteos coincidieron: clientes 4, productos 11 y pedidos 7.
Activos/inactivos: clientes 2/2, productos 9/2 y pedidos 5/2.
Los siete pedidos superaron las validaciones de datos historicos,
cantidades, precios, subtotales y totales.

Reporte recuperado:
- hogar: 3 unidades y 90000 centavos.
- libreria: 5 unidades y 250000 centavos.
Coincide con el resultado del origen consultado anteriormente.

Inicio UTC: 2026-10-23T15:34:38Z.
Fin UTC: 2026-10-23T15:34:40Z.
Tiempo medido: 2 segundos, incluyendo restauracion, comparacion
de conteos, validaciones de pedidos y consulta del reporte.
Esta medicion corresponde a recuperacion local de datos;
no incluye levantar la aplicacion ni recuperar el servicio completo.
No se realizo comparacion campo por campo con Atlas.
