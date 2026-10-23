#!/bin/bash
set -euo pipefail
umask 077

#============# Rutas y parametros #============#
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$RAIZ/scripts/backup.config.yml"
BASE="tpi_tienda"
RESGUARDOS="$RAIZ/resguardos_tpi"
FECHA="$(date +%F)"
DESTINO="$RESGUARDOS/$FECHA"
BLOQUEO="$RESGUARDOS/.backup.lock"
TEMPORAL=""
ANTERIOR=""
FORZAR=false

case "${1:-}" in
  "") ;;
  --forzar) FORZAR=true ;;
  *) echo "Uso: ./scripts/backup.sh [--forzar]"; exit 1 ;;
esac

if [[ $# -gt 1 ]]; then
  echo "ERROR: demasiados argumentos."
  exit 1
fi

informar() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

validar_copia() {
  local carpeta="$1"
  local coleccion
  [[ -d "$carpeta" && ! -L "$carpeta" ]] || return 1
  for coleccion in clientes productos pedidos; do
    [[ -f "$carpeta/$BASE/$coleccion.bson" ]] || return 1
    [[ -s "$carpeta/$BASE/$coleccion.metadata.json" ]] || return 1
  done
}

#============# Comprobaciones iniciales #============#
command -v mongodump >/dev/null 2>&1 || {
  informar "ERROR: no se encontro mongodump."
  exit 1
}

[[ -f "$CONFIG" ]] || {
  informar "ERROR: falta scripts/backup.config.yml."
  exit 1
}

mkdir -p "$RESGUARDOS"

if ! mkdir "$BLOQUEO" 2>/dev/null; then
  informar "ERROR: existe un bloqueo; comprobar si hay otro backup en curso."
  exit 1
fi

#============# Limpieza y recuperacion ante fallos #============#
limpiar() {
  local codigo=$?
  trap - EXIT

  if [[ -n "$ANTERIOR" && -d "$ANTERIOR/copia" ]]; then
    if [[ ! -e "$DESTINO" ]]; then
      if mv "$ANTERIOR/copia" "$DESTINO"; then
        informar "Se recupero la copia anterior."
      else
        informar "ERROR: copia anterior conservada en $ANTERIOR/copia"
        codigo=1
      fi
    else
      informar "Copia anterior conservada en $ANTERIOR/copia"
    fi
  fi

  if [[ -n "$TEMPORAL" && -d "$TEMPORAL" ]]; then
    rm -rf -- "$TEMPORAL"
  fi
  if [[ -n "$ANTERIOR" && -d "$ANTERIOR" ]]; then
    rmdir "$ANTERIOR" 2>/dev/null || true
  fi
  rmdir "$BLOQUEO" 2>/dev/null || true
  exit "$codigo"
}

trap limpiar EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

#============# Revisar la copia existente #============#
if [[ -e "$DESTINO" || -L "$DESTINO" ]]; then
  if [[ ! -f "$DESTINO/.completo" ]] || ! validar_copia "$DESTINO"; then
    informar "ERROR: el destino no es una copia validada. No se reemplaza."
    exit 1
  fi
  if [[ "$FORZAR" == false ]]; then
    informar "OMITIDO: ya existe una copia completa de hoy."
    exit 0
  fi
fi

#============# Crear y validar la nueva copia #============#
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

if ! /bin/bash "$RAIZ/scripts/generar-conteos.sh" \
  "$TEMPORAL/$BASE" > "$TEMPORAL/conteos-esperados.json"; then
  informar "ERROR: no se pudieron generar los conteos del respaldo."
  exit 1
fi

informar "Conteos generados desde los BSON de la nueva copia."

rm -f "$TEMPORAL/herramienta.log"
date '+%Y-%m-%dT%H:%M:%S%z' > "$TEMPORAL/.completo"

#============# Publicar sin borrar primero la copia anterior #============#
if [[ -d "$DESTINO" ]]; then
  ANTERIOR="$(mktemp -d "$RESGUARDOS/.anterior.XXXXXX")"
  mv "$DESTINO" "$ANTERIOR/copia"
fi

mv "$TEMPORAL" "$DESTINO"
TEMPORAL=""

if [[ -n "$ANTERIOR" ]]; then
  rm -rf -- "$ANTERIOR/copia"
  rmdir "$ANTERIOR"
  ANTERIOR=""
  informar "Copia del dia reemplazada despues de validar la nueva."
fi

informar "OK: respaldo validado en $DESTINO"
informar "Fin del respaldo."

#============# Retencion de cinco fechas completas #============#
if [[ -L "$RESGUARDOS" ]]; then
  informar "ERROR: no se aplica retencion sobre un directorio simbolico."
  exit 1
fi

COPIAS=()

while IFS= read -r NOMBRE; do
  CARPETA="$RESGUARDOS/$NOMBRE"

  [[ "$NOMBRE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || continue
  [[ -d "$CARPETA" && ! -L "$CARPETA" ]] || continue
  [[ -f "$CARPETA/.completo" ]] || continue

  FECHA_VALIDADA="$(date -j -f '%Y-%m-%d' "$NOMBRE" '+%Y-%m-%d' 2>/dev/null)" || continue
  [[ "$FECHA_VALIDADA" == "$NOMBRE" ]] || continue

  if validar_copia "$CARPETA"; then
    COPIAS[${#COPIAS[@]}]="$NOMBRE"
  fi
done < <(
  for CARPETA in "$RESGUARDOS"/*; do
    [[ -d "$CARPETA" ]] || continue
    basename "$CARPETA"
  done | LC_ALL=C sort -r
)

INDICE=5
while [[ "$INDICE" -lt "${#COPIAS[@]}" ]]; do
  NOMBRE="${COPIAS[$INDICE]}"
  CARPETA="$RESGUARDOS/$NOMBRE"

  if [[ -d "$CARPETA" && ! -L "$CARPETA" &&
        -f "$CARPETA/.completo" ]] && validar_copia "$CARPETA"; then
    rm -rf -- "$CARPETA"
    informar "Retencion: eliminada copia antigua $NOMBRE."
  fi

  INDICE=$((INDICE + 1))
done

informar "Retencion finalizada: se conservan hasta cinco fechas completas."
