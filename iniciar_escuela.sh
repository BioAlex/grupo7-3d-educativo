#!/bin/bash
echo "========================================================"
echo "  SIMULACIENCIA 3D - SERVIDOR LOCAL PARA COLEGIOS"
echo "========================================================"
echo ""
echo "Iniciando el servidor local para el aula sin internet..."
echo ""

if [ ! -d "node_modules" ]; then
    echo "[1/2] Primera ejecución detectada. Instalando paquetes locales..."
    npm install
else
    echo "[1/2] Módulos locales verificados."
fi

echo "[2/2] Lanzando servidor en la red local..."
echo ""
echo "Acceso local: http://localhost:3000"
echo "Para tablets/alumnos en la misma red Wi-Fi: http://$(hostname -I | awk '{print $1}'):3000"
echo ""

# Intentar abrir el navegador automáticamente si existe xdg-open o open
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

npm run dev -- --host 0.0.0.0 --port 3000
