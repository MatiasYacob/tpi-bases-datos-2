#!/bin/bash
set -euo pipefail
umask 077

CARPETA="${1:-}"

if [[ $# -ne 1 || ! -d "$CARPETA" ]]; then
  echo "Uso: generar-conteos.sh CARPETA_CON_BSON" >&2
  exit 1
fi

command -v bsondump >/dev/null 2>&1 || {
  echo "ERROR: falta bsondump." >&2
  exit 1
}

contar() {
  local archivo="$CARPETA/$1.bson"
  if [[ ! -f "$archivo" || -L "$archivo" ]]; then
    echo "ERROR: falta un BSON regular de $1." >&2
    return 1
  fi

  if ! bsondump --quiet --objcheck "$archivo" 2>/dev/null |
    awk 'END { print NR+0 }'; then
    echo "ERROR: no se pudo procesar el BSON de $1." >&2
    return 1
  fi
}

CLIENTES="$(contar clientes)"
PRODUCTOS="$(contar productos)"
PEDIDOS="$(contar pedidos)"

printf '{"clientes":%d,"productos":%d,"pedidos":%d}\n' \
  "$CLIENTES" "$PRODUCTOS" "$PEDIDOS"
