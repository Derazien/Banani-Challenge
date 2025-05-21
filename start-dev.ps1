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
            
            # Check for required NestJS and TypeORM packages
            $typeormPath = Join-Path $nodeModulesPath 'typeorm'
            $classValidatorPath = Join-Path $nodeModulesPath 'class-validator'
            $classTransformerPath = Join-Path $nodeModulesPath 'class-transformer'
            
            if (-not (Test-Path $nestPath) -or -not (Test-Path $typeormPath) -or 
                -not (Test-Path $classValidatorPath) -or -not (Test-Path $classTransformerPath)) {
                Write-Host "Required NestJS packages not found. Installing dependencies..." -ForegroundColor Yellow
                npm install typeorm class-validator class-transformer
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
$backendEnvPath = Join-Path $rootDir "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "Warning: .env file not found in backend directory." -ForegroundColor Yellow
    Write-Host "Creating a template .env file..." -ForegroundColor Yellow
    
    # Create a comprehensive .env file template with all required variables
    $envContent = @"
# Database Configuration
DB_PATH=../data/banani.sqlite
DB_SYNC=true
DB_LOGGING=false

# API Settings
PORT=3001

# AI Configuration
HUGGINGFACE_API_KEY=
HUGGINGFACE_BASE_URL=https://d8123bj0ak13ehp1.us-east4.gcp.endpoints.huggingface.cloud/v1/
AI_MODEL_NAME=neurospaicy
AI_MAX_TOKENS=1000

# Security
HANDLER_ENCRYPTION_KEY=development-secret-key-change-in-production
"@
    $envContent | Out-File -FilePath $backendEnvPath -Encoding utf8
    
    Write-Host "Please add your Hugging Face API key to the .env file before continuing." -ForegroundColor Red
    Write-Host "You can also configure other settings if needed." -ForegroundColor Yellow
    Write-Host "Press any key to continue after adding your API key..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Ensure data directory exists for SQLite database
# $dataDir = Join-Path $rootDir 'backend/data'
# if (-not (Test-Path $dataDir)) {
#     Write-Host "Creating data directory for SQLite database..." -ForegroundColor Yellow
#     New-Item -ItemType Directory -Path $dataDir | Out-Null
# }

# $sqliteDbPath = Join-Path $dataDir 'banani.sqlite'
# if (-not (Test-Path $sqliteDbPath)) {
#     Write-Host "Creating empty SQLite database file..." -ForegroundColor Yellow
#     New-Item -ItemType File -Path $sqliteDbPath | Out-Null
# }

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

# Validate required env variables are set
$envContent = Get-Content $backendEnvPath -Raw
$missingVars = @()

foreach ($envVar in @('HUGGINGFACE_API_KEY', 'HUGGINGFACE_BASE_URL')) {
    if ($envContent -notmatch "$envVar=.+") {
        $missingVars += $envVar
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "Error: Missing required environment variables in backend/.env:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host "Please add the missing values and run the script again." -ForegroundColor Yellow
    exit 1
}

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Green
$backendDir = Join-Path $rootDir 'backend'

# Create a backend startup script
$backendStartScript = @"
# Load environment variables from .env file
`$envFile = Join-Path "$backendDir" ".env"
if (Test-Path `$envFile) {
    Get-Content `$envFile | ForEach-Object {
        if (`$_ -match '^([^#][^=]+)=(.*)$') {
            `$key = `$matches[1].Trim()
            `$value = `$matches[2].Trim()
            [Environment]::SetEnvironmentVariable(`$key, `$value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

# Start the backend
Set-Location "$backendDir"
npm run start:dev
"@

$backendScriptPath = Join-Path $env:TEMP "start-backend.ps1"
$backendStartScript | Out-File -FilePath $backendScriptPath -Encoding utf8
Start-Process powershell -ArgumentList "-NoExit", "-File", $backendScriptPath

# Start client
Write-Host "Starting client..." -ForegroundColor Green
$clientDir = Join-Path $rootDir 'client'

# Create a client startup script
$clientStartScript = @"
Set-Location "$clientDir"
npm run dev
"@

$clientScriptPath = Join-Path $env:TEMP "start-client.ps1"
$clientStartScript | Out-File -FilePath $clientScriptPath -Encoding utf8
Start-Process powershell -ArgumentList "-NoExit", "-File", $clientScriptPath

Write-Host "All services started!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Client:  http://localhost:3000" -ForegroundColor Cyan 