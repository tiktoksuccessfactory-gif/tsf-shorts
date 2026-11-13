@echo off
REM TSF Shorts (c) 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedazy, zasady: LICENSE.txt
title TSF Shorts - render
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Brak Node.js. Zainstaluj wersje LTS ze strony https://nodejs.org i uruchom ponownie.
  pause
  exit /b 1
)
if not exist "node_modules\three\package.json" (
  echo Pierwsze uruchomienie: instaluje potrzebne paczki, to potrwa chwile...
  call npm install --no-audit --no-fund --legacy-peer-deps
  if errorlevel 1 (
    echo Instalacja nie wyszla. Sprawdz internet i sprobuj jeszcze raz.
    pause
    exit /b 1
  )
)
echo.
echo Odcinki:
for /d %%D in (episodes\*) do if exist "%%D\episode.js" echo    %%~nxD
echo.
set /p EP=Wpisz nazwe odcinka: 
if "%EP%"=="" exit /b 1
echo.
echo 1 = finalny film 1080x1920
echo 2 = szybki podglad 540x960
echo 3 = tylko dzwiek i napisy od nowa (obraz bez zmian)
set Q=1
set /p Q=Wybierz 1, 2 albo 3 [1]: 
set FLAGS=
if "%Q%"=="2" set FLAGS=--draft
if "%Q%"=="3" set FLAGS=--skip-render
echo.
node scripts\make.mjs %EP% %FLAGS%
if errorlevel 1 (
  echo.
  echo Cos poszlo nie tak, komunikat jest wyzej.
  pause
  exit /b 1
)
start "" "out\%EP%"
pause
