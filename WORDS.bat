@echo off
REM TSF Shorts (c) 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedazy, zasady: LICENSE.txt
title TSF Shorts - czasy slow
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
set PY=python
where py >nul 2>nul
if not errorlevel 1 set PY=py -3
%PY% -c "import faster_whisper" >nul 2>nul
if errorlevel 1 (
  echo Instaluje faster-whisper ^(raz^)...
  %PY% -m pip install faster-whisper
)
%PY% scripts\words.py %EP%
pause
