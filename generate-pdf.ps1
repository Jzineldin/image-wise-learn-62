Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tale Forge Business Plan PDF Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Installing required packages..." -ForegroundColor Yellow
npm install marked puppeteer --save-dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install packages!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Converting markdown to PDF..." -ForegroundColor Yellow
node convert-to-pdf.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PDF generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Opening PDF..." -ForegroundColor Yellow

$pdfPath = Join-Path $PSScriptRoot "Tale_Forge_Business_Plan_2025.pdf"

if (Test-Path $pdfPath) {
    Start-Process $pdfPath
    Write-Host ""
    Write-Host "✅ PDF generated and opened successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $pdfPath" -ForegroundColor Cyan
} else {
    Write-Host "❌ PDF file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

