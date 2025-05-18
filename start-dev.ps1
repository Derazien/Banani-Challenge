# start-dev.ps1
Write-Host "Starting Banani Challenge App..." -ForegroundColor Cyan

$rootDir = Get-Location

function Test-Command {
    param([string]$command)
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

function Install-IfNeeded {
    param([string]$dir)
    $fullPath = Join-Path $rootDir $dir
    
    # Change to directory
    Set-Location $fullPath
    
    Write-Host "Checking dependencies in $dir..." -ForegroundColor Yellow
    
    # Force reinstall if node_modules doesn't exist
    if (-not (Test-Path (Join-Path $fullPath 'node_modules'))) {
        Write-Host "Installing dependencies in $dir..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error installing dependencies in $dir. Exiting." -ForegroundColor Red
            Set-Location $rootDir
            exit 1
        }
        Write-Host "Dependencies installed successfully in $dir." -ForegroundColor Green
    } else {
        Write-Host "Dependencies folder exists in $dir." -ForegroundColor Green
        
        # Check for specific binaries and packages to ensure dependencies are properly installed
        if ($dir -eq 'backend') {
            $nodeModulesPath = Join-Path $fullPath 'node_modules'
            $binPath = Join-Path $nodeModulesPath '.bin'
            $nestPath = Join-Path $binPath 'nest.cmd'
            
            # Check for required NestJS validation packages
            $classValidatorPath = Join-Path $nodeModulesPath 'class-validator'
            $classTransformerPath = Join-Path $nodeModulesPath 'class-transformer'
            
            if (-not (Test-Path $nestPath) -or -not (Test-Path $classValidatorPath) -or -not (Test-Path $classTransformerPath)) {
                Write-Host "Required NestJS packages not found. Installing dependencies..." -ForegroundColor Yellow
                npm install class-validator class-transformer
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Error installing dependencies in $dir. Exiting." -ForegroundColor Red
                    Set-Location $rootDir
                    exit 1
                }
            }
        } elseif ($dir -eq 'client') {
            $nodeModulesPath = Join-Path $fullPath 'node_modules'
            $binPath = Join-Path $nodeModulesPath '.bin'
            $nextPath = Join-Path $binPath 'next.cmd'
            
            if (-not (Test-Path $nextPath)) {
                Write-Host "next binary not found. Reinstalling client dependencies..." -ForegroundColor Yellow
                npm install
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Error reinstalling dependencies in $dir. Exiting." -ForegroundColor Red
                    Set-Location $rootDir
                    exit 1
                }
            }
        }
    }
    
    # Return to root directory
    Set-Location $rootDir
}

# Check for npm
if (-not (Test-Command 'npm')) {
    Write-Host "npm is not installed or not in PATH. Please install Node.js and npm first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing/checking dependencies..." -ForegroundColor Cyan
Install-IfNeeded 'backend'
Install-IfNeeded 'client'

# Check if .env file exists in backend directory
$backendEnvPath = Join-Path $rootDir 'backend\.env'
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "Warning: .env file not found in backend directory." -ForegroundColor Yellow
    Write-Host "Creating a template .env file with HUGGINGFACE_API_KEY placeholder..." -ForegroundColor Yellow
    
    # Create a basic .env file template
    @"
# Backend Environment Variables
HUGGINGFACE_API_KEY=
HUGGINGFACE_BASE_URL=https://d8123bj0ak13ehp1.us-east4.gcp.endpoints.huggingface.cloud/v1/
AI_MODEL_NAME=neurospaicy
AI_MAX_TOKENS=1000
PORT=3001
"@ | Out-File -FilePath $backendEnvPath -Encoding utf8
    
    Write-Host "Please add your Hugging Face API key to $backendEnvPath before continuing." -ForegroundColor Red
    Write-Host "You can also configure AI_MODEL_NAME and AI_MAX_TOKENS if needed." -ForegroundColor Yellow
    Write-Host "Press any key to continue after adding your API key..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Build backend
Set-Location (Join-Path $rootDir 'backend')
Write-Host "Building backend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building backend. Exiting." -ForegroundColor Red
    Set-Location $rootDir
    exit 1
}
Write-Host "Backend built successfully." -ForegroundColor Green
Set-Location $rootDir

# Start backend with proper PATH handling
Write-Host "Starting backend server..." -ForegroundColor Green
$backendDir = Join-Path $rootDir 'backend'
$backendCommand = "
Set-Location '$backendDir'
`$env:NODE_ENV = 'development'
`$nodeBinDir = Join-Path (Get-Location) 'node_modules\.bin'
`$env:PATH = `$nodeBinDir + ';' + `$env:PATH
npm run start:dev
"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand

# Start client with proper PATH handling
Write-Host "Starting client..." -ForegroundColor Green
$clientDir = Join-Path $rootDir 'client'
$clientCommand = "
Set-Location '$clientDir'
`$nodeBinDir = Join-Path (Get-Location) 'node_modules\.bin'
`$env:PATH = `$nodeBinDir + ';' + `$env:PATH
npm run dev
"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $clientCommand

Write-Host "All services started!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Client:  http://localhost:3000" -ForegroundColor Cyan 