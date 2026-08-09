# setup-local.ps1
# Installs dependencies and prepares the local React + Python JSON API environment.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "=== Setup local environment for Clinic Finance ===" -ForegroundColor Cyan

# Ensure we are in the repository root
if (-Not (Test-Path "package.json")) {
    Write-Error "package.json not found. Run this script from the repository root."
    exit 1
}

# Node install
Write-Host "Installing frontend dependencies..." -ForegroundColor Green
npm install

# Create .env.local from example if missing
if (-Not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "Created .env.local from .env.example." -ForegroundColor Green
    } else {
        Write-Warning ".env.example not found. Please create .env.local with VITE_API_BASE=http://localhost:8000/api"
    }
} else {
    Write-Host ".env.local already exists." -ForegroundColor Yellow
}

# Python install
Write-Host "Installing Python dependencies..." -ForegroundColor Green
$pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { 'python' } elseif (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { $null }

if ($null -eq $pythonCmd) {
    Write-Warning "Python was not found. Please install Python 3.11+ and ensure 'python' or 'py' is on PATH."
} elseif (Test-Path "requirements.txt") {
    & $pythonCmd -m pip install --upgrade pip
    & $pythonCmd -m pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found. Skipping Python dependency installation."
}

Write-Host "Setup complete. To run locally: npm run api and npm run dev" -ForegroundColor Cyan
Write-Host "Recommended workflow:" -ForegroundColor Yellow
Write-Host "  1) npm run api" -ForegroundColor Yellow
Write-Host "  2) npm run dev" -ForegroundColor Yellow
Write-Host "If you want to launch both in parallel, open a second PowerShell window for the frontend." -ForegroundColor Yellow
