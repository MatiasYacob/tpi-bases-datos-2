#!/bin/bash
set -euo pipefail
umask 077

#============# Validar sistema y horario #============#
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "ERROR: este programador requiere macOS."
  exit 1
fi

HORARIO="${1:-02:00}"

if [[ $# -gt 1 || ! "$HORARIO" =~ ^([01][0-9]|2[0-3]):[0-5][0-9]$ ]]; then
  echo "Uso: ./scripts/programar-backup.sh HH:MM"
  exit 1
fi

HORA=$((10#${HORARIO%:*}))
MINUTO=$((10#${HORARIO#*:}))
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NOMBRE="TPI-Tienda-Backup"
ARCHIVO="$HOME/Library/LaunchAgents/$NOMBRE.plist"
DOMINIO="gui/$(id -u)"
LOGS="$RAIZ/resguardos_tpi/logs"

[[ -f "$RAIZ/scripts/backup.sh" ]] || {
  echo "ERROR: falta backup.sh."
  exit 1
}

[[ -f "$RAIZ/scripts/backup.config.yml" ]] || {
  echo "ERROR: falta la configuracion local."
  exit 1
}

command -v mongodump >/dev/null 2>&1 || {
  echo "ERROR: no se encontro mongodump."
  exit 1
}

# Escapar rutas antes de escribirlas en XML.
xml() {
  printf '%s' "$1" | sed \
    -e 's/&/\&amp;/g' \
    -e 's/</\&lt;/g' \
    -e 's/>/\&gt;/g'
}

RUTA_SCRIPT="$(xml "$RAIZ/scripts/backup.sh")"
RUTA_LOGS="$(xml "$LOGS")"
RUTA_PATH="$(xml "$(dirname "$(command -v mongodump)"):/usr/bin:/bin:/usr/sbin:/sbin")"

mkdir -p "$HOME/Library/LaunchAgents" "$LOGS"

#============# Crear configuracion de la tarea #============#
cat > "$ARCHIVO" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$NOMBRE</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$RUTA_SCRIPT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$RUTA_PATH</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$HORA</integer>
    <key>Minute</key>
    <integer>$MINUTO</integer>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$RUTA_LOGS/backup-diario.log</string>
  <key>StandardErrorPath</key>
  <string>$RUTA_LOGS/backup-diario-error.log</string>
</dict>
</plist>
PLIST

#============# Registrar sin duplicar #============#
chmod 600 "$ARCHIVO"
/usr/bin/plutil -lint "$ARCHIVO"

/bin/launchctl bootout "$DOMINIO/$NOMBRE" 2>/dev/null || true
/bin/launchctl bootstrap "$DOMINIO" "$ARCHIVO"

echo "OK: tarea $NOMBRE registrada para las $HORARIO, hora local."
echo "Tambien intentara el respaldo al cargar la tarea o iniciar sesion."
echo "Los registros se guardan en $LOGS"
