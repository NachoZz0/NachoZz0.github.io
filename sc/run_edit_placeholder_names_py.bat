@echo off
setlocal

where python >nul 2>nul
if %errorlevel%==0 (
    start "" pythonw "%~dp0edit_placeholder_names.py" --file "%~dp0原始文件.yaml"
    exit /b 0
)

where py >nul 2>nul
if %errorlevel%==0 (
    start "" py -3 "%~dp0edit_placeholder_names.py" --file "%~dp0原始文件.yaml"
    exit /b 0
)

echo Python was not found in PATH.
echo Run edit_placeholder_names.py with your Python interpreter.
pause
