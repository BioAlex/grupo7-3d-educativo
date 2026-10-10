@echo off
title SimulaCiencia 3D - Servidor Escolar Local
echo ========================================================
echo   SIMULACIENCIA 3D - SERVIDOR LOCAL PARA COLEGIOS
echo ========================================================
echo.
echo Iniciando el servidor local para el aula sin internet...
echo.

if not exist node_modules (
    echo [1/2] Primera ejecucion detectada. Instalando paquetes locales...
    call npm install
) else (
    echo [1/2] Modulos locales verificados.
)

echo [2/2] Lanzando servidor en la red local...
echo.
echo Los alumnos pueden conectarse desde tablets o PCs en la misma red Wi-Fi.
echo Abriendo aplicacion en el navegador...
echo.

start http://localhost:3000
call npm run dev -- --host 0.0.0.0 --port 3000
pause
