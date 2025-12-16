$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Info([string]$Message) {
  Write-Host $Message -ForegroundColor Cyan
}

function Run-Step([string]$Title, [string]$Command) {
  Write-Host ""
  Info $Title
  Write-Host ">> $Command"
  cmd /c $Command
  if ($LASTEXITCODE -ne 0) {
    Fail "$Title failed with exit code $LASTEXITCODE"
  }
}

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path -Path $Path)) {
    return
  }
  
  $lines = Get-Content -Path $Path -ErrorAction SilentlyContinue
  if ($null -eq $lines) {
    return
  }
  
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
      continue
    }
    
    # Parse KEY=value
    $eqIndex = $trimmed.IndexOf("=")
    if ($eqIndex -le 0) {
      continue
    }
    
    $key = $trimmed.Substring(0, $eqIndex).Trim()
    $value = $trimmed.Substring($eqIndex + 1).Trim()
    
    # Skip if key is empty
    if ([string]::IsNullOrWhiteSpace($key)) {
      continue
    }
    
    # Remove quotes if present
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    
    # Only set if not already set in environment
    $existing = [Environment]::GetEnvironmentVariable($key)
    if ([string]::IsNullOrWhiteSpace($existing)) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

# 1) Ensure repo root
if (-not (Test-Path -Path ".\package.json")) {
  Fail "Run this script from the repository root (package.json not found)."
}

# 2) Ensure node + npm
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail "Node.js not found in PATH."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Fail "npm not found in PATH."
}

Info "WELLIFY Business release verification (Windows PowerShell)"

# 2.5) Load environment variables from .env files
Import-DotEnv ".env.local"
Import-DotEnv ".env"

# 3) Install + lint + build
Run-Step "Install dependencies" "npm ci"
Run-Step "Run lint" "npm run lint"
Run-Step "Run build" "npm run build"

# 4) Env check
$RequiredVars = @(
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET"
)

$OptionalVars = @(
  "TELEGRAM_API_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "WEBHOOK_URL",
  "VALIDATE_ENV"
)

Write-Host ""
Info "Environment variables check"
Write-Host "Required:"
$RequiredVars | ForEach-Object { Write-Host "  - $_" }
Write-Host "Optional:"
$OptionalVars | ForEach-Object { Write-Host "  - $_" }

$Missing = @()
foreach ($v in $RequiredVars) {
  $val = [Environment]::GetEnvironmentVariable($v)
  if ([string]::IsNullOrWhiteSpace($val)) {
    $Missing += $v
  }
}

if ($Missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Missing required environment variables:" -ForegroundColor Yellow
  $Missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  Fail "Set the missing variables and rerun."
}

Write-Host ""
Write-Host "Verification PASSED" -ForegroundColor Green
exit 0
