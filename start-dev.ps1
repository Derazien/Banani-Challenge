# start-dev.ps1
Write-Host "Starting Banani Challenge App..." -ForegroundColor Cyan

$rootDir = Get-Location

function Install-IfNeeded {
    param([string]$dir)
    $fullPath = Join-Path $rootDir $dir
    if (-not (Test-Path (Join-Path $fullPath 'node_modules'))) {
        Write-Host "Installing dependencies in $dir..." -ForegroundColor Yellow
        Set-Location $fullPath
        npm install
        Set-Location $rootDir
    } else {
        Write-Host "Dependencies already installed in $dir." -ForegroundColor Green
    }
}

Install-IfNeeded 'backend'
Install-IfNeeded 'client'

# Build backend
Set-Location (Join-Path $rootDir 'backend')
Write-Host "Building backend..." -ForegroundColor Yellow
npm run build
Set-Location $rootDir

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; npm run dev'

# Start client
Write-Host "Starting client..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd client; npm run dev'

Write-Host "All services started!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Client:  http://localhost:3000" -ForegroundColor Cyan 