#!/bin/bash
set -euo pipefail

#============# Rutas y parametros #============#
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FECHA="${1:-}"
DESTINO="tpi_tienda_restore_test"

if [[ $# -ne 1 || ! "$FECHA" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Uso: ./scripts/verificar-conteos.sh AAAA-MM-DD"
  exit 1
fi

ESPERADOS="$RAIZ/resguardos_tpi/$FECHA/conteos-esperados.json"

if [[ ! -f "$ESPERADOS" ]]; then
  echo "ERROR: faltan los conteos esperados de esa copia."
  exit 1
fi

command -v mongosh >/dev/null 2>&1 || {
  echo "ERROR: no se encontro mongosh."
  exit 1
}

#============# Comparacion automatica #============#
env TPI_ARCHIVO_CONTEOS="$ESPERADOS" \
  mongosh "mongodb://127.0.0.1:27017/$DESTINO" --quiet --eval '
    const fs = require("fs");
    const esperados = JSON.parse(
      fs.readFileSync(process.env.TPI_ARCHIVO_CONTEOS, "utf8")
    );
    const colecciones = ["clientes", "productos", "pedidos"];

    for (const nombre of colecciones) {
      if (!Number.isSafeInteger(esperados[nombre]) ||
          esperados[nombre] < 0) {
        print("ERROR: conteo esperado invalido para " + nombre);
        quit(1);
      }
    }

    let coincide = true;
    for (const nombre of colecciones) {
      const obtenido = db.getCollection(nombre).countDocuments();
      const correcto = obtenido === esperados[nombre];
      print(
        nombre + ": esperado=" + esperados[nombre] +
        ", recuperado=" + obtenido +
        (correcto ? " -> OK" : " -> DIFERENCIA")
      );
      if (!correcto) coincide = false;
    }

    if (!coincide) {
      print("ERROR: los conteos recuperados no coinciden.");
      quit(1);
    }

    print("OK: los tres conteos coinciden con los valores esperados.");
  '
