#!/bin/bash
set -euo pipefail

#============# Rutas y configuracion #============#
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$RAIZ/scripts/backup.config.yml"
BASE="tpi_tienda"
RESGUARDOS="$RAIZ/resguardos_tpi"
FECHA="$(date +%F)"
DESTINO="$RESGUARDOS/$FECHA"
BLOQUEO="$RESGUARDOS/.backup.lock"
TEMPORAL=""

informar() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

validar_copia() {
  local carpeta="$1"
  local coleccion
  for coleccion in clientes productos pedidos; do
    [[ -f "$carpeta/$BASE/$coleccion.bson" ]] || return 1
    [[ -s "$carpeta/$BASE/$coleccion.metadata.json" ]] || return 1
  done
}

#============# Comprobaciones iniciales #============#
if ! command -v mongodump >/dev/null 2>&1; then
  informar "ERROR: no se encontro mongodump."
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  informar "ERROR: falta scripts/backup.config.yml."
  exit 1
fi

mkdir -p "$RESGUARDOS"

if ! mkdir "$BLOQUEO" 2>/dev/null; then
  informar "ERROR: existe un bloqueo; comprobar si hay otro backup en curso."
  exit 1
fi

limpiar() {
  if [[ -n "$TEMPORAL" && -d "$TEMPORAL" ]]; then
    rm -rf -- "$TEMPORAL"
  fi
  rmdir "$BLOQUEO" 2>/dev/null || true
}

trap limpiar EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

#============# Evitar sobrescribir copias #============#
if [[ -e "$DESTINO" ]]; then
  if [[ -f "$DESTINO/.completo" ]] && validar_copia "$DESTINO"; then
    informar "OMITIDO: ya existe una copia completa de hoy."
    exit 0
  fi
  informar "ERROR: el destino existe pero no es una copia validada."
  exit 1
fi

#============# Crear y validar el respaldo #============#
TEMPORAL="$(mktemp -d "$RESGUARDOS/.temporal.XXXXXX")"
informar "Inicio del respaldo de $BASE."

if ! mongodump --config="$CONFIG" --db="$BASE" \
  --out="$TEMPORAL" >"$TEMPORAL/herramienta.log" 2>&1; then
  informar "ERROR: mongodump fallo. Revisar conexion, configuracion y permisos."
  exit 1
fi

if ! validar_copia "$TEMPORAL"; then
  informar "ERROR: faltan archivos BSON o metadatos esperados."
  exit 1
fi

# El registro interno no se publica porque podria contener datos sensibles.
rm -f "$TEMPORAL/herramienta.log"
date '+%Y-%m-%dT%H:%M:%S%z' > "$TEMPORAL/.completo"
mv "$TEMPORAL" "$DESTINO"
TEMPORAL=""

informar "OK: respaldo validado en $DESTINO"
informar "Fin del respaldo."
