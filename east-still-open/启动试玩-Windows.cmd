@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
title East Still Open - Local Demo
cd /d "%~dp0"
set "GAME_ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "GAME_ARCH=%PROCESSOR_ARCHITEW6432%"
set "GAME_RUNTIME="
if /I "%GAME_ARCH%"=="AMD64" set "GAME_RUNTIME=%~dp0runtime\win-x64\node.exe"
if /I "%GAME_ARCH%"=="ARM64" set "GAME_RUNTIME=%~dp0runtime\win-arm64\node.exe"
if not defined GAME_RUNTIME (
  echo This package needs 64-bit Windows 10 or 11. Please send this message to the organizer.
  pause
  exit /b 1
)
if not exist "%GAME_RUNTIME%" (
  echo Missing game runtime. Please extract the WHOLE ZIP first.
  echo Do not run this file inside the ZIP preview.
  pause
  exit /b 1
)
"%GAME_RUNTIME%" "%~dp0scripts\serve-demo.mjs"
if errorlevel 1 (
  echo Game startup failed. Please send the message above to the organizer.
  pause
  exit /b 1
)
endlocal
