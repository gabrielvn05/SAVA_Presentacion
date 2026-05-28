# Instala dependencias para generar PDF con formato institucional (sin LibreOffice).
Write-Host "=== SAVA: configuracion de generacion PDF ===" -ForegroundColor Cyan

Write-Host "`n1) Instalando Chromium para Playwright..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..
npm install playwright --no-save 2>$null
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
  Write-Host "   No se pudo instalar Chromium. Intenta ejecutar como administrador." -ForegroundColor Red
} else {
  Write-Host "   Chromium listo." -ForegroundColor Green
}

Write-Host "`n2) LibreOffice (opcional, mejor calidad Word->PDF)..." -ForegroundColor Yellow
$lo = "C:\Program Files\LibreOffice\program\soffice.exe"
if (Test-Path $lo) {
  Write-Host "   LibreOffice ya esta instalado." -ForegroundColor Green
} else {
  Write-Host "   No detectado. Puedes instalar con:" -ForegroundColor DarkYellow
  Write-Host "   winget install TheDocumentFoundation.LibreOffice" -ForegroundColor White
}

Write-Host "`nListo. Reinicia 'npm run dev' y regenera el certificado." -ForegroundColor Cyan
