# Respaldos del TPI

Scripts Bash de Brenda para macOS: `backup.sh`, `programar-backup.sh`, `restaurar-prueba.sh` y `verificar-conteos.sh`.

Para Windows hay equivalentes PowerShell: `backup.ps1`, `programar-backup.ps1`, `restaurar-prueba.ps1` y `verificar-conteos.ps1`.

Consultar [la guía de Windows](../docs/respaldos-windows.md) para requisitos, comandos y pruebas. La configuración privada y los volcados están excluidos de Git.

Las herramientas CLI deben instalarse aparte. Nunca versionar backup.config.yml, .env ni resguardos_tpi/. Las tareas diarias se activan explícitamente; clonar el repositorio no las registra.
