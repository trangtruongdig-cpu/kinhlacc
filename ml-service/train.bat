@echo off
echo === TCM Tongue CNN Training (Full Shenzhen Dataset) ===
cd /d "%~dp0"

REM Tạo venv nếu chưa có
if not exist "venv\Scripts\python.exe" (
    echo [1/4] Tạo virtual environment...
    python -m venv venv
)

REM Cài dependencies
echo [2/4] Cài dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

REM Kiểm tra dataset
if not exist "..\tools\_tongue_work" (
    echo THIẾU dataset! Cần giải nén trước:
    echo   cd tools
    echo   tar -xf shezhen_datasets1.zip
    pause
    exit /b 1
)

REM Chạy training
echo [3/4] Bắt đầu training... (ước tính 1-8 giờ tùy CPU)
echo       Kết quả sẽ lưu tại: model\tongue_cnn.h5
echo.
python train.py --source dataset

echo.
echo [4/4] Training xong! Chạy start.bat để khởi động service.
pause
