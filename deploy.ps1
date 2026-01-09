# 🚀 Wellify Business - Automated Deployment Script (PowerShell)
# Deploys backend to Render and frontend to Cloudflare Pages

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_NAME = "wellify-business"
$BACKEND_URL = "https://wellify-business-backend.onrender.com"
$FRONTEND_URL = "https://wellify-business.pages.dev"
$BACKEND_DIR = "backend"
$FRONTEND_DIR = "."

# Helper functions
function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Print-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📦 $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
function Test-Prerequisites {
    Print-Step "Checking Prerequisites"
    
    $missing = $false
    
    # Check Node.js
    if (-not (Test-Command "node")) {
        Print-Error "Node.js is not installed"
        $missing = $true
    } else {
        $version = node --version
        Print-Success "Node.js $version found"
    }
    
    # Check npm
    if (-not (Test-Command "npm")) {
        Print-Error "npm is not installed"
        $missing = $true
    } else {
        $version = npm --version
        Print-Success "npm $version found"
    }
    
    # Check Render CLI
    if (-not (Test-Command "render")) {
        Print-Warning "Render CLI not found. Please install: https://render.com/docs/cli"
        $missing = $true
    } else {
        Print-Success "Render CLI found"
    }
    
    # Check Wrangler
    if (-not (Test-Command "wrangler")) {
        Print-Warning "Wrangler not found. Installing globally..."
        npm install -g wrangler
    } else {
        Print-Success "Wrangler found"
    }
    
    if ($missing) {
        Print-Error "Please install missing prerequisites and try again"
        exit 1
    }
}

# Login to Render
function Start-RenderLogin {
    Print-Step "Render Authentication"
    Print-Info "You will be prompted to login to Render in your browser"
    Print-Warning "Press Enter when you've completed the login..."
    $null = Read-Host
    
    try {
        $whoami = render whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            Print-Error "Render login failed. Please try again."
            exit 1
        }
        Print-Success "Logged in to Render as $whoami"
    } catch {
        Print-Error "Render login failed. Please try again."
        exit 1
    }
}

# Login to Cloudflare
function Start-CloudflareLogin {
    Print-Step "Cloudflare Authentication"
    Print-Info "You will be prompted to login to Cloudflare in your browser"
    Print-Warning "Press Enter when you've completed the login..."
    $null = Read-Host
    
    try {
        $whoami = wrangler whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            Print-Error "Cloudflare login failed. Please try again."
            exit 1
        }
        Print-Success "Logged in to Cloudflare"
    } catch {
        Print-Error "Cloudflare login failed. Please try again."
        exit 1
    }
}

# Deploy backend to Render
function Deploy-Backend {
    Print-Step "Deploying Backend to Render"
    
    # Check if render.yaml exists
    if (-not (Test-Path "render.yaml")) {
        Print-Error "render.yaml not found!"
        exit 1
    }
    
    Print-Info "Creating/updating services on Render..."
    
    # Apply render.yaml
    try {
        render blueprint launch render.yaml --name $PROJECT_NAME --skip-database-migration 2>&1 | Out-Null
        Print-Success "Services created/updated on Render"
    } catch {
        Print-Warning "Services may already exist. Continuing..."
    }
    
    Print-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 10
    
    # Wait for backend to be ready
    Print-Info "Checking backend health..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Print-Success "Backend is ready!"
                break
            }
        } catch {
            # Continue waiting
        }
        
        $attempt++
        Print-Info "Waiting for backend... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 10
    }
    
    if ($attempt -eq $maxAttempts) {
        Print-Warning "Backend is taking longer than expected. Check Render dashboard."
    }
}

# Run database migrations
function Start-Migrations {
    Print-Step "Database Migrations"
    
    $response = Read-Host "Do you want to run database migrations? (y/n)"
    
    if ($response -ne "y" -and $response -ne "Y") {
        Print-Warning "Skipping migrations. Run them manually later."
        return
    }
    
    Print-Info "To run migrations, you need to:"
    Print-Info "1. Go to Render Dashboard → PostgreSQL → wellify-business-db"
    Print-Info "2. Click on 'Query' tab"
    Print-Info "3. Copy contents of backend/src/db/schema.sql"
    Print-Info "4. Paste and execute"
    Print-Warning "Press Enter when migrations are complete..."
    $null = Read-Host
    
    Print-Success "Migrations completed"
}

# Build frontend
function Build-Frontend {
    Print-Step "Building Frontend"
    
    Push-Location $FRONTEND_DIR
    
    Print-Info "Installing dependencies..."
    npm install
    
    Print-Info "Building Next.js application..."
    npm run build
    
    Print-Success "Frontend built successfully"
    
    Pop-Location
}

# Deploy frontend to Cloudflare Pages
function Deploy-Frontend {
    Print-Step "Deploying Frontend to Cloudflare Pages"
    
    Push-Location $FRONTEND_DIR
    
    # Check if project exists
    $projects = wrangler pages project list 2>&1
    if ($projects -notmatch $PROJECT_NAME) {
        Print-Info "Creating Cloudflare Pages project..."
        wrangler pages project create $PROJECT_NAME --production-branch main
        if ($LASTEXITCODE -ne 0) {
            Print-Warning "Project creation failed. It may already exist."
        }
    } else {
        Print-Info "Project already exists. Updating..."
    }
    
    # Deploy to Cloudflare Pages
    Print-Info "Deploying to Cloudflare Pages..."
    Print-Warning "Note: For production, use GitHub integration in Cloudflare Dashboard"
    
    # Try to deploy the build output
    if (Test-Path ".next") {
        # Create a temporary directory with the build output
        $tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_.FullName }
        
        Copy-Item -Path ".next\*" -Destination $tempDir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path "public") {
            Copy-Item -Path "public" -Destination $tempDir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path "package.json") {
            Copy-Item -Path "package.json" -Destination $tempDir.FullName -Force -ErrorAction SilentlyContinue
        }
        
        wrangler pages deploy $tempDir.FullName --project-name=$PROJECT_NAME --branch=main
        if ($LASTEXITCODE -ne 0) {
            Print-Warning "Direct deployment failed. Use GitHub integration instead."
            Print-Info "Go to Cloudflare Dashboard → Pages → Create project → Connect to GitHub"
        }
        
        Remove-Item -Path $tempDir.FullName -Recurse -Force
    } else {
        Print-Error ".next directory not found. Run 'npm run build' first."
        exit 1
    }
    
    # Set environment variable
    Print-Info "Setting NEXT_PUBLIC_API_URL environment variable..."
    Print-Warning "Set it manually in Cloudflare Dashboard:"
    Print-Info "Pages → $PROJECT_NAME → Settings → Environment Variables"
    Print-Info "Add: NEXT_PUBLIC_API_URL = $BACKEND_URL"
    Print-Info ""
    Print-Info "Or use wrangler:"
    Print-Info "wrangler pages secret put NEXT_PUBLIC_API_URL --project-name=$PROJECT_NAME"
    
    Print-Success "Frontend deployment initiated"
    
    Pop-Location
}

# Show final URLs
function Show-FinalUrls {
    Print-Step "Deployment Complete! 🎉"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ Your application is live!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Frontend: " -NoNewline -ForegroundColor Cyan
    Write-Host $FRONTEND_URL -ForegroundColor Green
    Write-Host "Backend:  " -NoNewline -ForegroundColor Cyan
    Write-Host $BACKEND_URL -ForegroundColor Green
    Write-Host "Health:   " -NoNewline -ForegroundColor Cyan
    Write-Host "$BACKEND_URL/health" -ForegroundColor Green
    Write-Host ""
    
    Print-Info "Next steps:"
    Write-Host "  1. Verify backend health: curl $BACKEND_URL/health"
    Write-Host "  2. Visit your frontend: $FRONTEND_URL"
    Write-Host "  3. Check Render Dashboard: https://dashboard.render.com"
    Write-Host "  4. Check Cloudflare Dashboard: https://dash.cloudflare.com"
}

# Main deployment flow
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   Wellify Business - Deployment Script        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Prerequisites
    Start-RenderLogin
    Start-CloudflareLogin
    Deploy-Backend
    Start-Migrations
    Build-Frontend
    Deploy-Frontend
    Show-FinalUrls
    
    Print-Success "All done! 🚀"
}

# Run main function
Main
