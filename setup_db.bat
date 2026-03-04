@echo off
echo Setting up MySQL database...
mysql -u root -e "SOURCE schema.sql"
if %errorlevel% equ 0 (
    echo Database setup completed successfully!
) else (
    echo Error: Make sure MySQL is running and accessible
)
pause
