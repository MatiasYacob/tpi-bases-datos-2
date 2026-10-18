#!/bin/bash
set -euo pipefail

#============# Configuracion de la prueba local #============#
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINO="tpi_tienda_restore_test"
URI_LOCAL="mongodb://127.0.0.1:27017"
FECHA="${1:-}"

if [[ ! "$FECHA" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Uso: ./scripts/restaurar-prueba.sh AAAA-MM-DD"
  exit 1
fi

COPIA="$RAIZ/resguardos_tpi/$FECHA"

for herramienta in mongorestore mongosh; do
  if ! command -v "$herramienta" >/dev/null 2>&1; then
    echo "ERROR: falta $herramienta."
    exit 1
  fi
done

#============# Validar la copia antes de restaurar #============#
if [[ ! -f "$COPIA/.completo" ]]; then
  echo "ERROR: la copia no tiene marca de finalizacion."
  exit 1
fi

for coleccion in clientes productos pedidos; do
  if [[ ! -f "$COPIA/tpi_tienda/$coleccion.bson" ||
        ! -s "$COPIA/tpi_tienda/$coleccion.metadata.json" ]]; then
    echo "ERROR: faltan archivos de $coleccion."
    exit 1
  fi
done

#============# Proteger el destino #============#
mongosh "$URI_LOCAL/$DESTINO" --quiet --eval '
  if (db.getCollectionNames().length > 0) {
    print("ERROR: el destino contiene colecciones. No se reemplazara.");
    quit(1);
  }
'

INICIO="$(date +%s)"
echo "Inicio de restauracion local en $DESTINO."

# Mapear las colecciones originales a la base de prueba.
mongorestore --uri="$URI_LOCAL" \
  --nsInclude='tpi_tienda.*' \
  --nsFrom='tpi_tienda.*' \
  --nsTo='tpi_tienda_restore_test.*' \
  "$COPIA"

#============# Consultar los datos recuperados #============#
mongosh "$URI_LOCAL/$DESTINO" --quiet --eval '
  const conteos = {
    clientes: db.clientes.countDocuments(),
    productos: db.productos.countDocuments(),
    pedidos: db.pedidos.countDocuments()
  };
  printjson(conteos);

  const pedido = db.pedidos.findOne({ activo: true });
  if (!pedido || !Array.isArray(pedido.items) || !pedido.items.length) {
    print("ERROR: no se encontro un pedido activo con items.");
    quit(1);
  }
  print("Pedido recuperado:");
  printjson(pedido);
'

FIN="$(date +%s)"
echo "OK: restauracion y consulta local completadas."
echo "Tiempo hasta finalizar las consultas: $((FIN - INICIO)) segundos."
