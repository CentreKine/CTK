@echo off
REM 🚀 Clinic Finance - Complete Backend Setup Script (Windows)

echo.
echo ╔════════════════════════════════════════╗
echo ║  🏥 Clinic Finance - Setup Script     ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

echo ✅ Docker found

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating .env file...
    copy backend\.env.example backend\.env
    echo ✅ .env created (update with your values)
) else (
    echo ✅ .env already exists
)

REM Start PostgreSQL
echo.
echo 🐘 Starting PostgreSQL container...
docker-compose up -d

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak

REM Install Node dependencies
echo.
echo 📦 Installing Node.js dependencies...
cd backend
call npm install
cd ..

REM Run migrations
echo.
echo 🗄️  Running database migrations...
cd backend
call npm run migrate 2>nul || echo ℹ️  Migrations may need manual setup
cd ..

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✅ Setup Complete!                   ║
echo ╠════════════════════════════════════════╣
echo ║                                        ║
echo ║  🌐 PostgreSQL:  localhost:5432       ║
echo ║  🎨 pgAdmin:     http://localhost:5050║
echo ║  💻 Backend:     http://localhost:3001║
echo ║                                        ║
echo ║  Next: cd backend && npm run dev      ║
echo ║                                        ║
echo ╚════════════════════════════════════════╝
echo.
pause
