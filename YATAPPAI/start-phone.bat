@echo off
echo ============================================
echo   Запуск YATAPPAI для телефона (QR-код)
echo ============================================
echo.
echo Остановите другие серверы (Ctrl+C), если они запущены.
echo.
pause
npx expo start --tunnel --port 8085
