@echo off
echo ========================================
echo Tale Forge Business Plan PDF Generator
echo ========================================
echo.

echo [1/3] Installing required packages...
call npm install marked puppeteer --save-dev

echo.
echo [2/3] Converting markdown to PDF...
node convert-to-pdf.js

echo.
echo [3/3] Opening PDF...
if exist "Tale_Forge_Business_Plan_2025.pdf" (
    start Tale_Forge_Business_Plan_2025.pdf
    echo.
    echo ✅ PDF generated and opened successfully!
) else (
    echo ❌ PDF generation failed!
)

echo.
pause

