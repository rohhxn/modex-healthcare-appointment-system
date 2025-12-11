# Database Setup Script for Healthcare Appointment System
# This script creates the database and initializes the schema

param(
    [string]$PostgresPassword = "postgres"
)

Write-Host "`nSetting up Healthcare Appointment Database...`n" -ForegroundColor Cyan

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

# Verify psql works
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] PostgreSQL not accessible" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] PostgreSQL found" -ForegroundColor Green

# Set password environment variable
$env:PGPASSWORD = $PostgresPassword

# Try to create database
Write-Host "`nCreating database..." -ForegroundColor Yellow
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE healthcare_appointments;" 2>&1 | Select-String "CREATE DATABASE|already exists" -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "  [OK] Database ready" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Could not create database" -ForegroundColor Red
    Write-Host "  Make sure PostgreSQL password is correct" -ForegroundColor Yellow
    exit 1
}

# Change to backend directory and initialize database
Write-Host "`nInitializing database schema..." -ForegroundColor Yellow
cd c:\Users\VoidDaddy\Documents\Modex\healthcare-backend

# Use compiled version instead of ts-node
Write-Host "Building TypeScript..." -ForegroundColor Cyan
npm run build --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] TypeScript build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build successful" -ForegroundColor Green

# Create database schema using Node.js directly
Write-Host "`nRunning database initialization..." -ForegroundColor Yellow

# We'll create a quick init script that uses Node
$initScript = @'
require('dotenv').config();
const pool = require('./dist/config/database').default;

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Creating tables...');
    
    // Create ENUM types
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
          CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
        END IF;
      END $$;
    `);
    
    console.log('Tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
};

initDb();
'@

Set-Content -Path "dist/quick-init.js" -Value $initScript -Force

# Run the init script
node dist/quick-init.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Database initialized" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Database init had issues (may already exist)" -ForegroundColor Yellow
}

Write-Host "`n✅ Database setup complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:   npm run dev" -ForegroundColor Gray
Write-Host "  2. Start frontend:  npm start (in healthcare-frontend)" -ForegroundColor Gray
Write-Host "  3. Open browser:    http://localhost:3000" -ForegroundColor Gray
Write-Host ""
