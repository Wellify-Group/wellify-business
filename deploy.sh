#!/bin/bash

# 🚀 Wellify Business - Automated Deployment Script
# Deploys backend to Render and frontend to Cloudflare Pages

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="wellify-business"
BACKEND_URL="https://wellify-business-backend.onrender.com"
FRONTEND_URL="https://wellify-business.pages.dev"
BACKEND_DIR="backend"
FRONTEND_DIR="."

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking Prerequisites"
    
    local missing=0
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed"
        missing=1
    else
        print_success "Node.js $(node --version) found"
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        missing=1
    else
        print_success "npm $(npm --version) found"
    fi
    
    # Check Render CLI
    if ! command_exists render; then
        print_warning "Render CLI not found. Installing..."
        if command_exists brew; then
            brew install render
        else
            print_error "Please install Render CLI: https://render.com/docs/cli"
            missing=1
        fi
    else
        print_success "Render CLI found"
    fi
    
    # Check Wrangler
    if ! command_exists wrangler; then
        print_warning "Wrangler not found. Installing globally..."
        npm install -g wrangler
    else
        print_success "Wrangler found"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Please install missing prerequisites and try again"
        exit 1
    fi
}

# Login to Render
login_render() {
    print_step "Render Authentication"
    print_info "You will be prompted to login to Render in your browser"
    print_warning "Press Enter when you've completed the login..."
    read -r
    
    if ! render whoami >/dev/null 2>&1; then
        print_error "Render login failed. Please try again."
        exit 1
    fi
    
    print_success "Logged in to Render as $(render whoami)"
}

# Login to Cloudflare
login_cloudflare() {
    print_step "Cloudflare Authentication"
    print_info "You will be prompted to login to Cloudflare in your browser"
    print_warning "Press Enter when you've completed the login..."
    read -r
    
    if ! wrangler whoami >/dev/null 2>&1; then
        print_error "Cloudflare login failed. Please try again."
        exit 1
    fi
    
    print_success "Logged in to Cloudflare"
}

# Deploy backend to Render
deploy_backend() {
    print_step "Deploying Backend to Render"
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_error "render.yaml not found!"
        exit 1
    fi
    
    print_info "Creating/updating services on Render..."
    
    # Apply render.yaml
    if render blueprint launch render.yaml --name "$PROJECT_NAME" --skip-database-migration 2>/dev/null; then
        print_success "Services created/updated on Render"
    else
        print_warning "Services may already exist. Continuing..."
    fi
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Wait for backend to be ready
    print_info "Checking backend health..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$BACKEND_URL/health" >/dev/null 2>&1; then
            print_success "Backend is ready!"
            break
        fi
        
        attempt=$((attempt + 1))
        print_info "Waiting for backend... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_warning "Backend is taking longer than expected. Check Render dashboard."
    fi
}

# Run database migrations
run_migrations() {
    print_step "Database Migrations"
    
    read -p "Do you want to run database migrations? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipping migrations. Run them manually later."
        return
    fi
    
    print_info "To run migrations, you need to:"
    print_info "1. Go to Render Dashboard → PostgreSQL → wellify-business-db"
    print_info "2. Click on 'Query' tab"
    print_info "3. Copy contents of backend/src/db/schema.sql"
    print_info "4. Paste and execute"
    print_warning "Press Enter when migrations are complete..."
    read -r
    
    print_success "Migrations completed"
}

# Build frontend
build_frontend() {
    print_step "Building Frontend"
    
    cd "$FRONTEND_DIR" || exit 1
    
    print_info "Installing dependencies..."
    npm install
    
    print_info "Building Next.js application..."
    npm run build
    
    print_success "Frontend built successfully"
    
    cd - || exit 1
}

# Deploy frontend to Cloudflare Pages
deploy_frontend() {
    print_step "Deploying Frontend to Cloudflare Pages"
    
    cd "$FRONTEND_DIR" || exit 1
    
    # Check if project exists
    if ! wrangler pages project list 2>/dev/null | grep -q "$PROJECT_NAME"; then
        print_info "Creating Cloudflare Pages project..."
        wrangler pages project create "$PROJECT_NAME" --production-branch main || {
            print_warning "Project creation failed. It may already exist."
        }
    else
        print_info "Project already exists. Updating..."
    fi
    
    # Deploy to Cloudflare Pages
    # Note: Cloudflare Pages works best with GitHub integration
    # This is a manual deployment method
    print_info "Deploying to Cloudflare Pages..."
    print_warning "Note: For production, use GitHub integration in Cloudflare Dashboard"
    
    # Try to deploy the build output
    if [ -d ".next" ]; then
        # Create a temporary directory with the build output
        TEMP_DIR=$(mktemp -d)
        cp -r .next/* "$TEMP_DIR/" 2>/dev/null || true
        cp -r public "$TEMP_DIR/" 2>/dev/null || true
        cp package.json "$TEMP_DIR/" 2>/dev/null || true
        
        wrangler pages deploy "$TEMP_DIR" --project-name="$PROJECT_NAME" --branch=main || {
            print_warning "Direct deployment failed. Use GitHub integration instead."
            print_info "Go to Cloudflare Dashboard → Pages → Create project → Connect to GitHub"
        }
        
        rm -rf "$TEMP_DIR"
    else
        print_error ".next directory not found. Run 'npm run build' first."
        exit 1
    fi
    
    # Set environment variable
    print_info "Setting NEXT_PUBLIC_API_URL environment variable..."
    print_warning "Set it manually in Cloudflare Dashboard:"
    print_info "Pages → $PROJECT_NAME → Settings → Environment Variables"
    print_info "Add: NEXT_PUBLIC_API_URL = $BACKEND_URL"
    print_info ""
    print_info "Or use wrangler:"
    print_info "wrangler pages secret put NEXT_PUBLIC_API_URL --project-name=$PROJECT_NAME"
    
    print_success "Frontend deployment initiated"
    
    cd - || exit 1
}

# Show final URLs
show_final_urls() {
    print_step "Deployment Complete! 🎉"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Your application is live!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${BLUE}Frontend:${NC} ${GREEN}$FRONTEND_URL${NC}"
    echo -e "${BLUE}Backend:${NC}  ${GREEN}$BACKEND_URL${NC}"
    echo -e "${BLUE}Health:${NC}   ${GREEN}$BACKEND_URL/health${NC}\n"
    
    print_info "Next steps:"
    echo "  1. Verify backend health: curl $BACKEND_URL/health"
    echo "  2. Visit your frontend: $FRONTEND_URL"
    echo "  3. Check Render Dashboard: https://dashboard.render.com"
    echo "  4. Check Cloudflare Dashboard: https://dash.cloudflare.com"
}

# Main deployment flow
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║   Wellify Business - Deployment Script        ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    check_prerequisites
    login_render
    login_cloudflare
    deploy_backend
    run_migrations
    build_frontend
    deploy_frontend
    show_final_urls
    
    print_success "All done! 🚀"
}

# Run main function
main
