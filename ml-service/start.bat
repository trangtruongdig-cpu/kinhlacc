@echo off
echo === TCM Tongue ML Service ===
cd /d "%~dp0"

REM Tạo venv nếu chưa có
if not exist "venv\Scripts\python.exe" (
    echo [1/3] Tạo virtual environment (Python 3.11)...
    py -3.11 -m venv venv
    echo [2/3] Cài dependencies...
    venv\Scripts\pip.exe install -r requirements.txt --quiet
) else (
    echo [OK] venv sẵn sàng.
)

REM Chạy service
echo Khởi động ML service tại http://localhost:3002
echo (Ctrl+C để dừng)
echo.
venv\Scripts\python.exe app.py
