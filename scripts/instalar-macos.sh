#!/bin/bash
set -euo pipefail
umask 077

#============# Validar entorno y archivos #============#
[[ "$(uname -s)" == "Darwin" ]] || {
  echo "ERROR: este instalador requiere macOS."
  exit 1
}

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINO="$HOME/TPI-Tienda-Backup"
CONFIG_DESTINO="$DESTINO/scripts/backup.config.yml"

if /bin/launchctl print "gui/$(id -u)/TPI-Tienda-Backup" >/dev/null 2>&1; then
  echo "ERROR: pausar la tarea antes de actualizar los scripts."
  exit 1
fi

for ARCHIVO in backup.sh restaurar-prueba.sh programar-backup.sh; do
  [[ -f "$RAIZ/scripts/$ARCHIVO" ]] || {
    echo "ERROR: falta $ARCHIVO en el proyecto."
    exit 1
  }
  /bin/bash -n "$RAIZ/scripts/$ARCHIVO"
done

# No instalar sobre enlaces simbolicos.
for RUTA in "$DESTINO" "$DESTINO/scripts" "$CONFIG_DESTINO"; do
  if [[ -L "$RUTA" ]]; then
    echo "ERROR: el destino contiene un enlace simbolico."
    exit 1
  fi
done

for ARCHIVO in backup.sh restaurar-prueba.sh programar-backup.sh; do
  if [[ -L "$DESTINO/scripts/$ARCHIVO" ]]; then
    echo "ERROR: el script de destino es un enlace simbolico."
    exit 1
  fi
done

if [[ ! -e "$CONFIG_DESTINO" &&
      ! -f "$RAIZ/scripts/backup.config.yml" ]]; then
  echo "ERROR: configurar primero scripts/backup.config.yml."
  exit 1
fi

#============# Instalar sin activar la tarea #============#
mkdir -p "$DESTINO/scripts"
chmod 700 "$DESTINO" "$DESTINO/scripts"

for ARCHIVO in backup.sh restaurar-prueba.sh programar-backup.sh; do
  /usr/bin/install -m 700 "$RAIZ/scripts/$ARCHIVO" \
    "$DESTINO/scripts/$ARCHIVO"
  cmp -s "$RAIZ/scripts/$ARCHIVO" "$DESTINO/scripts/$ARCHIVO"
  echo "OK: $ARCHIVO actualizado y comparado con el original."
done

if [[ -e "$CONFIG_DESTINO" ]]; then
  [[ -f "$CONFIG_DESTINO" ]] || {
    echo "ERROR: la configuracion de destino no es un archivo."
    exit 1
  }
  echo "Configuracion existente conservada sin reemplazar."
else
  /usr/bin/install -m 600 "$RAIZ/scripts/backup.config.yml" \
    "$CONFIG_DESTINO"
  echo "Configuracion local instalada."
fi

chmod 600 "$CONFIG_DESTINO"
echo "OK: instalacion terminada en $DESTINO."
echo "No se activo ni registro ninguna tarea."
echo "Los respaldos existentes no se modificaron."
