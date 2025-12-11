# Healthcare Appointment System - Local Setup Script
# Run this script to automatically set up your local development environment

param(
    [switch]$SkipNpmInstall = $false,
    [switch]$SkipDbInit = $false
)

$projectRoot = "c:\Users\VoidDaddy\Documents\Modex"
$backendDir = Join-Path $projectRoot "healthcare-backend"
$frontendDir = Join-Path $projectRoot "healthcare-frontend"

Write-Host "Healthcare Appointment System - Local Setup" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}
$nodeVersion = node --version
Write-Host "  [OK] Node.js $nodeVersion found" -ForegroundColor Green

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed!" -ForegroundColor Red
    exit 1
}
$npmVersion = npm --version
Write-Host "  [OK] npm $npmVersion found" -ForegroundColor Green

# Check PostgreSQL
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] PostgreSQL $pgVersion found" -ForegroundColor Green
} else {
    Write-Host "  [WARN] PostgreSQL not found in PATH" -ForegroundColor Yellow
    Write-Host "   If PostgreSQL is installed, add it to PATH" -ForegroundColor Gray
}

Write-Host ""

# Install dependencies
if (-not $SkipNpmInstall) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    
    Write-Host "  > Backend..." -ForegroundColor Cyan
    Push-Location $backendDir
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Backend npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "    [OK] Backend dependencies installed" -ForegroundColor Green
    Pop-Location
    
    Write-Host "  > Frontend..." -ForegroundColor Cyan
    Push-Location $frontendDir
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Frontend npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "    [OK] Frontend dependencies installed" -ForegroundColor Green
    Pop-Location
}

Write-Host ""

# Initialize database
if (-not $SkipDbInit) {
    Write-Host "Initializing database..." -ForegroundColor Yellow
    
    # Check PostgreSQL service
    $pgService = Get-Service | Where-Object {$_.Name -like "*postgres*"} | Select-Object -First 1
    
    if ($pgService) {
        if ($pgService.Status -ne "Running") {
            Write-Host "  > Starting PostgreSQL service ($($pgService.Name))..." -ForegroundColor Cyan
            Start-Service $pgService.Name
            Start-Sleep -Seconds 2
            Write-Host "    [OK] PostgreSQL started" -ForegroundColor Green
        } else {
            Write-Host "  [OK] PostgreSQL is running" -ForegroundColor Green
        }
    } else {
        Write-Host "  [WARN] PostgreSQL service not found" -ForegroundColor Yellow
        Write-Host "   Make sure PostgreSQL is running manually" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Create database
    Write-Host "  > Creating database..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE healthcare_appointments;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] Database created" -ForegroundColor Green
    } else {
        Write-Host "    [INFO] Database might already exist (continuing...)" -ForegroundColor Yellow
    }
    
    Write-Host "  > Running initialization script..." -ForegroundColor Cyan
    Push-Location $backendDir
    npm run db:init
    Pop-Location
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend (Terminal 1):" -ForegroundColor White
Write-Host "   cd $backendDir" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd $frontendDir" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open Browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "For more help, see LOCAL_SETUP.md and QUICK_COMMANDS.md" -ForegroundColor Cyan
Write-Host ""
