# PART 1
## Overview, Prerequisites, and Service Accounts Setup

Version: 4.0 (Full Service Integration)
Target: AI assistants (Cursor, Claude, etc.)
Last Updated: 2025-01-09

---

## TABLE OF CONTENTS

- PART 1: Overview, Prerequisites, Service Accounts (this file)
- PART 2: GitHub and Cloudflare Setup
- PART 3: Render.com Backend Deployment
- PART 4: Email (Resend) and Payments (Stripe) Integration
- PART 5: Telegram Bot and SMS (Twilio) Integration
- PART 6: Final Verification and Testing
- PART 7: Troubleshooting and Maintenance

---

## DEPLOYMENT OVERVIEW

### What This Guide Does

This guide provides AI assistant with complete instructions to:

1. Create and configure ALL required service accounts
2. Set up code repository on GitHub
3. Deploy frontend to Cloudflare Pages with CDN
4. Deploy backend to Render.com with PostgreSQL
5. Configure email sending via Resend
6. Set up payment processing via Stripe
7. Integrate Telegram bot for support
8. Set up SMS verification via Twilio
9. Connect all services together
10. Test all integrations end-to-end
11. Provide user with working test domain

### What User Does

User only needs to:

1. Confirm browser authorizations (6 times total):
   - GitHub CLI
   - Cloudflare (Wrangler)
   - Render CLI
   - Resend dashboard
   - Stripe dashboard
   - Telegram API

2. Copy/paste API keys when prompted (5 times total):
   - Resend API key
   - Stripe secret key
   - Stripe publishable key
   - Stripe webhook secret
   - Twilio credentials (if using SMS)
   - Telegram bot token

3. Answer yes/no questions (2-3 times):
   - Run database migrations?
   - Set up SMS verification?
   - Create test user?

Total time: 45-60 minutes
User active time: 10-15 minutes
AI automated time: 30-45 minutes

### Final Result

After completion, user receives:

- Frontend URL: `https://PROJECT_NAME.pages.dev`
- Backend URL: `https://PROJECT_NAME-backend.onrender.com`
- Admin panel: `https://PROJECT_NAME.pages.dev/admin`
- All integrations working
- Test domain ready
- All code on GitHub
- Ready for UI/UX customization

---

## SYSTEM REQUIREMENTS

### Local Machine Requirements

AI must verify user has:

**Required:**
- Node.js 18+ installed
- npm or yarn installed
- Git installed
- Terminal/Command Prompt access
- Internet connection

**Check commands:**
```bash
node --version
# Expected: v18.0.0 or higher

npm --version
# Expected: 8.0.0 or higher

git --version
# Expected: 2.0.0 or higher
```

**If not installed, provide links:**
- Node.js: https://nodejs.org/en/download/
- Git: https://git-scm.com/downloads

**Optional but recommended:**
- GitHub CLI (gh): https://cli.github.com/
- Visual Studio Code: https://code.visualstudio.com/

---

## SERVICE ACCOUNTS REQUIRED

AI must ensure user has accounts on these services. If not, provide signup instructions.

### 1. GitHub Account

**Purpose:** Code repository, version control, CI/CD

**Required for:** Storing code, automatic deployments

**Signup:** https://github.com/signup

**Free tier:** Unlimited public repositories

**AI verification after signup:**
```bash
git config --global user.name
git config --global user.email
# Should show user's GitHub username and email
```

**If not configured:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

### 2. Cloudflare Account

**Purpose:** Frontend hosting, CDN, edge functions, database, storage

**Required for:** 
- Cloudflare Pages (frontend hosting)
- Cloudflare Workers (edge functions)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (file storage)
- Cloudflare KV (cache)

**Signup:** https://dash.cloudflare.com/sign-up

**Free tier includes:**
- Unlimited Pages deployments
- 100,000 Workers requests/day
- 5 GB D1 storage
- 10 GB R2 storage/month
- 100,000 KV reads/day

**AI asks user:**
"Do you have a Cloudflare account? (yes/no)"

**If no:**
1. Direct user to https://dash.cloudflare.com/sign-up
2. User fills: email, password
3. User verifies email
4. User completes signup

**AI verification after signup:**
User should be able to access https://dash.cloudflare.com/

---

### 3. Render.com Account

**Purpose:** Backend hosting, PostgreSQL database

**Required for:**
- Node.js backend API
- PostgreSQL 15 database
- Automatic deployments
- Environment variables management

**Signup:** https://dashboard.render.com/register

**Free tier includes:**
- 750 hours/month web service (512 MB RAM)
- PostgreSQL database (90 days retention)
- Automatic SSL
- Custom domains

**AI asks user:**
"Do you have a Render.com account? (yes/no)"

**If no:**
1. Direct user to https://dashboard.render.com/register
2. User can sign up with:
   - GitHub (recommended)
   - GitLab
   - Google
   - Email
3. User verifies email if using email signup

**AI verification after signup:**
User should be able to access https://dashboard.render.com/

**Important notes for user:**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-50 seconds to wake up
- This is normal for free tier
- Paid tier ($7/month) keeps services always running

---

### 4. Resend Account

**Purpose:** Transactional email sending (welcome emails, password resets, notifications)

**Required for:**
- User registration emails
- Password reset emails
- Email verification
- Notifications
- Marketing emails (optional)

**Signup:** https://resend.com/signup

**Free tier includes:**
- 100 emails/day
- 3,000 emails/month
- Custom domain support
- Email analytics
- Webhook events

**AI asks user:**
"Do you have a Resend account? (yes/no)"

**If no:**
1. Direct user to https://resend.com/signup
2. User fills: email, password, company name
3. User verifies email
4. User completes onboarding

**AI verification after signup:**
User should be able to access https://resend.com/dashboard

**Important notes for user:**
- Free tier is sufficient for most projects
- Custom domain setup is optional but recommended
- Without custom domain, emails sent from `onboarding@resend.dev`
- With custom domain, emails sent from your domain

---

### 5. Stripe Account

**Purpose:** Payment processing, subscriptions, invoicing

**Required for:**
- Accepting credit card payments
- Subscription management
- Invoice generation
- Refunds
- Payment analytics

**Signup:** https://dashboard.stripe.com/register

**Free tier includes:**
- Test mode (unlimited transactions)
- 2.9% + $0.30 per successful charge (live mode)
- No monthly fees
- Full API access
- Webhook support

**AI asks user:**
"Do you have a Stripe account? (yes/no)"

**If no:**
1. Direct user to https://dashboard.stripe.com/register
2. User fills: email, password, country
3. User verifies email
4. User can skip business details for now (test mode works without)

**AI verification after signup:**
User should be able to access https://dashboard.stripe.com/test/dashboard

**Important notes for user:**
- Start in TEST mode (no real money)
- Activate live mode later when ready to accept real payments
- Test mode has test card numbers (4242 4242 4242 4242)
- Webhook signing is required for security

---

### 6. Telegram Bot Account

**Purpose:** Customer support bot, notifications, two-way communication

**Required for:**
- Customer support via Telegram
- Sending notifications to users
- Receiving support requests
- Admin notifications

**Signup:** No separate account needed, use existing Telegram

**Free tier:** Completely free, unlimited messages

**AI asks user:**
"Do you have Telegram installed? (yes/no)"

**If no:**
1. Direct user to https://telegram.org/apps
2. User downloads Telegram for their platform
3. User creates account with phone number

**AI asks user:**
"Do you want to create a support bot? (yes/no)"

**If yes:**
1. User opens Telegram
2. User searches for @BotFather
3. User sends `/newbot` command
4. BotFather asks for bot name (e.g., "My Project Support Bot")
5. BotFather asks for bot username (e.g., "myproject_support_bot")
6. BotFather provides bot token (e.g., "123456789:ABCdefGHIjklMNOpqrsTUVwxyz")

**AI must store:**
- Bot token for backend configuration
- Bot username for user instructions

**AI verification after creation:**
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
# Should return bot information
```

**Important notes for user:**
- Bot token is like a password - keep it secret
- Bot can send messages but users must start conversation first
- Bot username must end with "bot"
- Bot can be renamed later via @BotFather

---

### 7. Twilio Account (Optional)

**Purpose:** SMS verification, two-factor authentication

**Required for:**
- Phone number verification
- SMS two-factor authentication
- SMS notifications
- Phone number validation

**Signup:** https://www.twilio.com/try-twilio

**Free tier includes:**
- $15 trial credit
- Test phone numbers
- ~500 SMS messages (depending on country)
- Full API access

**AI asks user:**
"Do you want SMS verification? (yes/no)"

**If no:** Skip Twilio setup entirely

**If yes:**
1. Direct user to https://www.twilio.com/try-twilio
2. User fills: email, password
3. User verifies email
4. User verifies phone number
5. User completes survey
6. User gets trial credit

**AI verification after signup:**
User should be able to access https://console.twilio.com/

**User must then:**
1. Go to Phone Numbers → Buy a Number
2. Select country
3. Select phone number
4. Confirm purchase (uses trial credit)

**AI must get from user:**
- Account SID (starts with AC...)
- Auth Token
- Phone number (e.g., +1234567890)

**Important notes for user:**
- Trial accounts can only send to verified phone numbers
- Upgrade to paid account to send to any number
- Trial credit lasts until used up (no expiration)
- SMS costs vary by country ($0.0075 - $0.05 per message)

---

## CREDENTIALS COLLECTION

AI must collect and store these credentials during setup.

### GitHub Credentials

**Collected automatically** when user runs `gh auth login` or `git push`

**AI stores:**
- GitHub username
- GitHub email
- Repository URL

**Format:**
```
GITHUB_USERNAME=username
GITHUB_EMAIL=email@example.com
GITHUB_REPO_URL=https://github.com/username/project-name
```

---

### Cloudflare Credentials

**Collected automatically** when user runs `npx wrangler login`

**AI must also collect:**
- Account ID (from dashboard or CLI)
- D1 Database ID (after creation)
- R2 Bucket name
- KV Namespace ID (after creation)

**Format:**
```
CLOUDFLARE_ACCOUNT_ID=abc123...
D1_DATABASE_ID=def456...
R2_BUCKET_NAME=project-name-files
KV_NAMESPACE_ID=ghi789...
```

---

### Render Credentials

**Collected automatically** when user runs `render login`

**AI must also collect:**
- Service name
- Database name
- Database connection URL (internal)

**Format:**
```
RENDER_SERVICE_NAME=project-name-backend
RENDER_DATABASE_NAME=project-name-db
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

---

### Resend Credentials

**User must provide:**
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "Production API Key"
4. Permission: "Sending access"
5. Click "Create"
6. Copy API key (starts with `re_...`)

**AI asks:**
"Please paste your Resend API key:"

**AI stores:**
```
RESEND_API_KEY=re_abc123...
```

**AI verifies:**
```bash
curl https://api.resend.com/domains \
  -H "Authorization: Bearer re_abc123..."
# Should return list of domains (may be empty)
```

---

### Stripe Credentials

**User must provide:**

**Test mode keys:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" (starts with `pk_test_...`)
3. Click "Reveal test key" for Secret key
4. Copy "Secret key" (starts with `sk_test_...`)

**AI asks:**
"Please paste your Stripe publishable key (pk_test_...):"
"Please paste your Stripe secret key (sk_test_...):"

**AI stores:**
```
STRIPE_PUBLISHABLE_KEY=pk_test_abc123...
STRIPE_SECRET_KEY=sk_test_def456...
```

**Webhook secret (collected later after webhook creation):**
```
STRIPE_WEBHOOK_SECRET=whsec_ghi789...
```

**AI verifies:**
```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_def456...: \
  -d limit=1
# Should return customer list (may be empty)
```

---

### Telegram Bot Credentials

**User must provide:**
1. Open Telegram
2. Find @BotFather
3. Send `/newbot`
4. Follow prompts
5. Copy bot token

**AI asks:**
"Please paste your Telegram bot token:"

**AI stores:**
```
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
TELEGRAM_BOT_USERNAME=myproject_support_bot
```

**AI verifies:**
```bash
curl https://api.telegram.org/bot123456789:ABCdef.../getMe
# Should return bot info
```

---

### Twilio Credentials (Optional)

**User must provide:**
1. Go to https://console.twilio.com/
2. Copy "Account SID" from dashboard
3. Copy "Auth Token" (click "View")
4. Go to Phone Numbers → Manage → Active numbers
5. Copy phone number

**AI asks:**
"Please paste your Twilio Account SID (AC...):"
"Please paste your Twilio Auth Token:"
"Please paste your Twilio phone number (+...):"

**AI stores:**
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=abc123...
TWILIO_PHONE_NUMBER=+1234567890
```

**AI verifies:**
```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json" \
  -u "AC...:abc123..."
# Should return messages list (may be empty)
```

---

## PRE-DEPLOYMENT CHECKLIST

AI must verify before starting deployment:

### Accounts Created
- [ ] GitHub account exists
- [ ] Cloudflare account exists
- [ ] Render.com account exists
- [ ] Resend account exists
- [ ] Stripe account exists
- [ ] Telegram bot created
- [ ] Twilio account exists (if using SMS)

### Credentials Collected
- [ ] GitHub configured (username, email)
- [ ] Resend API key obtained
- [ ] Stripe keys obtained (publishable + secret)
- [ ] Telegram bot token obtained
- [ ] Twilio credentials obtained (if using SMS)

### Local Environment Ready
- [ ] Node.js 18+ installed
- [ ] npm/yarn installed
- [ ] Git installed
- [ ] Terminal access available
- [ ] Internet connection stable

### Project Files Ready
- [ ] All source code generated
- [ ] package.json files created
- [ ] Configuration files created
- [ ] Database schema created
- [ ] Environment templates created

### User Understands
- [ ] Deployment will take 45-60 minutes
- [ ] User needs to authorize in browser (6 times)
- [ ] User needs to paste API keys (5-7 times)
- [ ] Some services may take 3-5 minutes to provision
- [ ] Free tiers have limitations (explained above)

---

## AI CONFIRMATION PROMPT

Before starting deployment, AI must ask:

```
I've verified all prerequisites are met:
- All required accounts created
- All credentials collected
- Local environment ready
- Project files generated

The deployment will:
1. Push code to GitHub
2. Deploy frontend to Cloudflare Pages
3. Deploy backend to Render.com
4. Configure PostgreSQL database
5. Set up email via Resend
6. Configure Stripe payments
7. Set up Telegram support bot
8. Set up SMS verification (optional)
9. Test all integrations

Estimated time: 45-60 minutes
Your active time: 10-15 minutes

Ready to begin? (yes/no)
```

**If user says yes:** Proceed to PART 2
**If user says no:** Ask what's missing and help resolve

---

## EMERGENCY STOP PROCEDURE

If deployment fails or user needs to stop:

**User can press:** Ctrl+C (Linux/Mac) or Ctrl+Break (Windows)

**AI will:**
1. Stop current operation
2. Note where deployment stopped
3. Ask: "Do you want to resume later or clean up?"

**If resume later:**
- AI saves current state
- User can run deployment again
- AI skips completed steps

**If clean up:**
- AI provides cleanup commands
- User can start fresh

---

# PART 2
## GitHub Repository and Cloudflare Platform Setup

Version: 4.0
Prerequisites: PART 1 completed

---

## GITHUB REPOSITORY SETUP

### Step 2.1: Initialize Git Repository

**AI executes:**
```bash
cd /path/to/project
git init
```

**Expected output:**
```
Initialized empty Git repository in /path/to/project/.git/
```

**AI verification:**
```bash
ls -la .git
# Should show .git directory exists
```

---

### Step 2.2: Configure Git (if not configured)

**AI checks:**
```bash
git config user.name
git config user.email
```

**If empty, AI asks user:**
"What is your name for Git commits?"
"What is your email for Git commits?"

**AI executes:**
```bash
git config --global user.name "User Name"
git config --global user.email "user@example.com"
```

---

### Step 2.3: Create .gitignore

**AI creates** `.gitignore` file:
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Environment files
.env
.env.local
.env.development
.env.test
.env.production
.env.*.local
*.local
.dev.vars

# Cloudflare
.wrangler/
wrangler.toml.backup
.mf/

# Render
.render/

# Database
*.db
*.sqlite
*.sql.backup

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Build
dist/
build/
.next/
out/
coverage/

# Backups
backups/
*.backup

# Secrets
secrets/
private/
*.pem
*.key

# Testing
.nyc_output/
test-results/

# Temporary
tmp/
temp/
*.tmp
```

**AI verification:**
```bash
cat .gitignore | wc -l
# Should show 50+ lines
```

---

### Step 2.4: Initial Commit

**AI executes:**
```bash
git add .
git commit -m "Initial commit: Complete project setup with all integrations"
```

**Expected output:**
```
[main (root-commit) abc1234] Initial commit: Complete project setup with all integrations
 XX files changed, XXXX insertions(+)
 create mode 100644 ...
```

**AI verification:**
```bash
git log --oneline
# Should show 1 commit
```

---

### Step 2.5: Create GitHub Repository

**Option A: Using GitHub CLI (recommended)**

**AI checks if GitHub CLI installed:**
```bash
which gh
```

**If not installed:**

Mac:
```bash
brew install gh
```

Linux:
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

Windows:
```powershell
winget install --id GitHub.cli
```

**AI executes:**
```bash
gh auth login
```

**User action:** 
1. Select "GitHub.com"
2. Select "HTTPS"
3. Authenticate with browser
4. Confirm in browser

**AI verification:**
```bash
gh auth status
# Should show: Logged in to github.com as username
```

**AI creates repository:**
```bash
gh repo create PROJECT_NAME --public --source=. --remote=origin --push
```

**Expected output:**
```
✓ Created repository username/PROJECT_NAME on GitHub
✓ Added remote origin
✓ Pushed commits to github.com/username/PROJECT_NAME.git
```

**Option B: Manual creation**

If GitHub CLI not available or fails:

**AI instructs user:**
```
1. Go to https://github.com/new
2. Repository name: PROJECT_NAME
3. Description: [Optional]
4. Visibility: Public
5. Do NOT initialize with README, .gitignore, or license
6. Click "Create repository"
7. Copy the repository URL shown
```

**AI asks:** "Please paste the GitHub repository URL:"

**AI executes:**
```bash
git remote add origin https://github.com/username/PROJECT_NAME.git
git branch -M main
git push -u origin main
```

**AI verification:**
```bash
git remote -v
# Should show origin URL

git branch
# Should show * main
```

**AI checks GitHub:**
```bash
curl -s https://api.github.com/repos/username/PROJECT_NAME | grep -q '"name"'
# Should return 0 (success)
```

---

### Step 2.6: Verify Repository

**AI provides user with repository URL:**
```
Your code is now on GitHub:
https://github.com/username/PROJECT_NAME

Please verify you can access this URL in your browser.
```

**User action:** Open URL in browser, confirm repository exists

---

## CLOUDFLARE WRANGLER SETUP

### Step 2.7: Install Wrangler

**AI checks if Wrangler installed:**
```bash
npx wrangler --version
```

**If not installed globally:**
```bash
npm install -g wrangler
```

**Or use project-local:**
```bash
npm install --save-dev wrangler
```

**AI verification:**
```bash
npx wrangler --version
# Should show version >= 3.0.0
```

---

### Step 2.8: Wrangler Authentication

**AI executes:**
```bash
npx wrangler login
```

**User action:** 
1. Browser opens automatically
2. Click "Allow" to authorize Wrangler
3. Browser shows "Success! You may now close this page"
4. Return to terminal

**AI verification:**
```bash
npx wrangler whoami
```

**Expected output:**
```
You are logged in with an OAuth Token

┌─────────────────────────────────┬──────────────────────────────────┐
│ Account Name                    │ Account ID                       │
├─────────────────────────────────┼──────────────────────────────────┤
│ user@example.com's Account      │ abc123def456...                  │
└─────────────────────────────────┴──────────────────────────────────┘
```

**AI stores:**
```
CLOUDFLARE_ACCOUNT_ID=abc123def456...
CLOUDFLARE_EMAIL=user@example.com
```

---

## CLOUDFLARE D1 DATABASE SETUP

### Step 2.9: Create D1 Database

**AI executes:**
```bash
npx wrangler d1 create PROJECT_NAME-db
```

**Expected output:**
```
✅ Successfully created DB 'PROJECT_NAME-db'

[[d1_databases]]
binding = "DB"
database_name = "PROJECT_NAME-db"
database_id = "abc123-def456-ghi789-jkl012"
```

**AI must:**
1. Copy the entire `[[d1_databases]]` block
2. Store `database_id` value
3. Update `wrangler.toml`

**AI stores:**
```
D1_DATABASE_ID=abc123-def456-ghi789-jkl012
D1_DATABASE_NAME=PROJECT_NAME-db
```

---

### Step 2.10: Update wrangler.toml with D1 Config

**AI finds** `wrangler.toml` file (should be in project root)

**AI updates** or adds this section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "PROJECT_NAME-db"
database_id = "abc123-def456-ghi789-jkl012"
```

**AI verification:**
```bash
grep -A 3 "d1_databases" wrangler.toml
# Should show the configuration
```

---

### Step 2.11: Prepare Database Schema

**AI verifies** `schema.sql` file exists

**If not exists, AI creates** `schema.sql`:
```sql
-- Enable UUID extension (D1 doesn't need this but PostgreSQL does)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  phone_verified INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'support')),
  stripe_customer_id TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  telegram_id TEXT,
  telegram_username TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Phone verification codes
CREATE TABLE IF NOT EXISTS phone_verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Telegram support conversations
CREATE TABLE IF NOT EXISTS telegram_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  telegram_chat_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'pending')),
  assigned_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Telegram messages
CREATE TABLE IF NOT EXISTS telegram_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  from_user TEXT NOT NULL CHECK(from_user IN ('user', 'support')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES telegram_conversations(id) ON DELETE CASCADE
);

-- Stripe subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment history
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  stripe_payment_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_conversations_chat ON telegram_conversations(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_user ON telegram_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_status ON telegram_conversations(status);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_conv ON telegram_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created ON telegram_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_telegram_conversations_timestamp 
  AFTER UPDATE ON telegram_conversations
  BEGIN
    UPDATE telegram_conversations SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
  AFTER UPDATE ON subscriptions
  BEGIN
    UPDATE subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
```

**AI verification:**
```bash
test -f schema.sql && echo "Schema file exists"
wc -l schema.sql
# Should show 200+ lines
```

---

### Step 2.12: Initialize D1 Database

**AI executes:**
```bash
npx wrangler d1 execute PROJECT_NAME-db --file=schema.sql
```

**Expected output:**
```
🌀 Executing on PROJECT_NAME-db (abc123-def456-ghi789-jkl012):
🌀 To execute on your local development database, use --local
🚣 Executed 50 commands in 1.23s
```

**AI verification:**
```bash
npx wrangler d1 execute PROJECT_NAME-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected output should list:**
```
users
email_verifications
phone_verifications
password_resets
sessions
telegram_conversations
telegram_messages
subscriptions
payments
audit_log
```

**AI counts tables:**
```bash
npx wrangler d1 execute PROJECT_NAME-db --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table'"
# Should return table_count = 10
```

---

## CLOUDFLARE R2 STORAGE SETUP

### Step 2.13: Create R2 Bucket

**AI executes:**
```bash
npx wrangler r2 bucket create PROJECT_NAME-files
```

**Expected output:**
```
✅ Created bucket 'PROJECT_NAME-files' in region WEUR (Western Europe)
```

**AI stores:**
```
R2_BUCKET_NAME=PROJECT_NAME-files
R2_BUCKET_REGION=WEUR
```

---

### Step 2.14: Update wrangler.toml with R2 Config

**AI updates** `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "FILES"
bucket_name = "PROJECT_NAME-files"
```

**AI verification:**
```bash
grep -A 2 "r2_buckets" wrangler.toml
# Should show the configuration
```

---

### Step 2.15: Verify R2 Bucket

**AI executes:**
```bash
npx wrangler r2 bucket list
```

**Expected output:**
```
┌────────────────────┬──────────────┐
│ Name               │ Creation Date│
├────────────────────┼──────────────┤
│ PROJECT_NAME-files │ 2025-01-09   │
└────────────────────┴──────────────┘
```

---

## CLOUDFLARE KV NAMESPACE SETUP

### Step 2.16: Create KV Namespace

**AI executes:**
```bash
npx wrangler kv:namespace create "CACHE"
```

**Expected output:**
```
✅ Success! Created KV namespace "CACHE"
Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "CACHE"
id = "abc123def456ghi789jkl"
```

**AI stores:**
```
KV_NAMESPACE_ID=abc123def456ghi789jkl
```

---

### Step 2.17: Create KV Preview Namespace

**AI executes:**
```bash
npx wrangler kv:namespace create "CACHE" --preview
```

**Expected output:**
```
✅ Success! Created KV namespace "CACHE"
Add the following to your wrangler.toml:

[[kv_namespaces]]
binding = "CACHE"
preview_id = "xyz789uvw456rst123abc"
```

**AI stores:**
```
KV_PREVIEW_NAMESPACE_ID=xyz789uvw456rst123abc
```

---

### Step 2.18: Update wrangler.toml with KV Config

**AI updates** `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "abc123def456ghi789jkl"
preview_id = "xyz789uvw456rst123abc"
```

**AI verification:**
```bash
grep -A 3 "kv_namespaces" wrangler.toml
# Should show the configuration
```

---

## CLOUDFLARE SECRETS SETUP

### Step 2.19: Generate JWT Secret

**AI generates secure JWT secret:**
```bash
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo $JWT_SECRET
```

**AI stores** this value for later use in Render

---

### Step 2.20: Set JWT_SECRET in Cloudflare

**AI executes:**
```bash
echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
```

**Expected output:**
```
✨ Success! Uploaded secret JWT_SECRET
```

**AI verification:**
```bash
npx wrangler secret list
```

**Expected output:**
```
┌────────────┬──────────────┐
│ Name       │ Created      │
├────────────┼──────────────┤
│ JWT_SECRET │ 2025-01-09   │
└────────────┴──────────────┘
```

---

### Step 2.21: Set RESEND_API_KEY in Cloudflare

**AI asks user:**
"Please paste your Resend API key (from PART 1):"

**AI stores** user input, then executes:
```bash
echo "$RESEND_API_KEY" | npx wrangler secret put RESEND_API_KEY
```

**Expected output:**
```
✨ Success! Uploaded secret RESEND_API_KEY
```

---

### Step 2.22: Set STRIPE_SECRET_KEY in Cloudflare

**AI asks user:**
"Please paste your Stripe secret key (sk_test_... from PART 1):"

**AI stores** user input, then executes:
```bash
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY
```

**Expected output:**
```
✨ Success! Uploaded secret STRIPE_SECRET_KEY
```

---

### Step 2.23: Set TELEGRAM_BOT_TOKEN in Cloudflare

**AI asks user:**
"Please paste your Telegram bot token (from PART 1):"

**AI stores** user input, then executes:
```bash
echo "$TELEGRAM_BOT_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN
```

**Expected output:**
```
✨ Success! Uploaded secret TELEGRAM_BOT_TOKEN
```

---

### Step 2.24: Set TWILIO Credentials (Optional)

**AI asks user:**
"Do you want to set up SMS verification with Twilio? (yes/no)"

**If yes:**

**AI asks:**
"Please paste your Twilio Auth Token:"

**AI stores** user input, then executes:
```bash
echo "$TWILIO_AUTH_TOKEN" | npx wrangler secret put TWILIO_AUTH_TOKEN
```

---

### Step 2.25: Verify All Secrets

**AI executes:**
```bash
npx wrangler secret list
```

**Expected output should include:**
```
JWT_SECRET
RESEND_API_KEY
STRIPE_SECRET_KEY
TELEGRAM_BOT_TOKEN
TWILIO_AUTH_TOKEN (if SMS enabled)
```

**AI counts secrets:**
```bash
npx wrangler secret list | grep -c "│"
# Should be >= 4 (or 5 if Twilio)
```

---

## CLOUDFLARE PAGES DEPLOYMENT

### Step 2.26: Build Frontend

**AI navigates to frontend:**
```bash
cd frontend
```

**AI checks package.json for build command:**
```bash
grep "\"build\":" package.json
```

**AI executes build:**
```bash
npm install
npm run build
```

**Expected output:**
```
> frontend@1.0.0 build
> next build

...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size
...
```

**AI verification:**
```bash
ls -la .next
# Should show build output directory
```

---

### Step 2.27: Deploy to Cloudflare Pages

**AI executes:**
```bash
npx wrangler pages deploy .next --project-name=PROJECT_NAME --branch=main
```

**Expected output:**
```
✨ Compiled Worker successfully
🌎 Deploying...
✨ Success! Uploaded X files (Y.YY sec)

✨ Deployment complete! Take a peek over at https://abc123.PROJECT_NAME.pages.dev
```

**AI must:**
1. Extract deployment URL from output
2. Store frontend URL

**AI stores:**
```
FRONTEND_URL=https://PROJECT_NAME.pages.dev
DEPLOYMENT_ID=abc123
```

---

### Step 2.28: Verify Frontend Deployment

**AI executes:**
```bash
curl -I https://PROJECT_NAME.pages.dev
```

**Expected output:**
```
HTTP/2 200
content-type: text/html
...
```

**AI also checks:**
```bash
curl -s https://PROJECT_NAME.pages.dev | grep -q "<html"
# Should return 0 (success)
```

---

### Step 2.29: Set Frontend Environment Variables

**AI executes:**
```bash
npx wrangler pages project set PROJECT_NAME NEXT_PUBLIC_API_URL="https://PROJECT_NAME-backend.onrender.com"
```

Note: Backend URL is a placeholder, will be updated after Render deployment in PART 3

**AI also sets:**
```bash
npx wrangler pages project set PROJECT_NAME NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
```

---

## CLOUDFLARE SETUP VERIFICATION

### Step 2.30: Final Cloudflare Checklist

**AI verifies:**

- [ ] Wrangler authenticated
- [ ] D1 database created and initialized
- [ ] 10 tables created in D1
- [ ] R2 bucket created
- [ ] KV namespace created (production + preview)
- [ ] All secrets set (4-5 secrets)
- [ ] Frontend built successfully
- [ ] Frontend deployed to Pages
- [ ] Frontend URL accessible
- [ ] Frontend environment variables set

**AI provides summary:**
```
Cloudflare Setup Complete!

D1 Database: PROJECT_NAME-db (abc123...)
R2 Bucket: PROJECT_NAME-files
KV Namespace: CACHE (abc123...)
Frontend URL: https://PROJECT_NAME.pages.dev

Secrets configured:
- JWT_SECRET
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- TELEGRAM_BOT_TOKEN
- TWILIO_AUTH_TOKEN (if enabled)

---

# PART 3
## Render.com Backend Deployment with PostgreSQL

Version: 4.0
Prerequisites: PART 1 and PART 2 completed

---

## RENDER CLI SETUP

### Step 3.1: Install Render CLI

**AI checks if Render CLI installed:**
```bash
which render
```

**If not found, AI installs based on OS:**

**Mac:**
```bash
brew tap render-oss/render
brew install render
```

**Linux:**
```bash
# Download latest release
RENDER_VERSION=$(curl -s https://api.github.com/repos/render-oss/cli/releases/latest | grep tag_name | cut -d'"' -f4)
curl -L "https://github.com/render-oss/cli/releases/latest/download/render-linux-amd64" -o render
chmod +x render
sudo mv render /usr/local/bin/
```

**Windows:**
```powershell
# Download from GitHub releases
Invoke-WebRequest -Uri "https://github.com/render-oss/cli/releases/latest/download/render-windows-amd64.exe" -OutFile "render.exe"
# Move to a directory in PATH
Move-Item render.exe C:\Windows\System32\render.exe
```

**AI verification:**
```bash
render --version
```

**Expected output:**
```
render version x.y.z
```

---

### Step 3.2: Render CLI Authentication

**AI executes:**
```bash
render login
```

**Expected behavior:**
- Browser opens automatically
- Shows Render login page
- Or shows "Authorize Render CLI" if already logged in

**User action:**
1. Log in to Render (if not already)
2. Click "Authorize" button
3. Browser shows success message
4. Return to terminal

**AI verification:**
```bash
render whoami
```

**Expected output:**
```
Logged in as user@example.com
```

**AI stores:**
```
RENDER_EMAIL=user@example.com
```

---

## RENDER.YAML CONFIGURATION

### Step 3.3: Create render.yaml

**AI creates** `backend/render.yaml`:

```yaml
services:
  # Main backend API service
  - type: web
    name: PROJECT_NAME-backend
    runtime: node
    region: oregon
    plan: free
    branch: main
    rootDir: backend
    buildCommand: npm install --production
    startCommand: npm start
    healthCheckPath: /api/health/live
    
    # Environment variables
    envVars:
      # Node environment
      - key: NODE_ENV
        value: production
      
      # Server port (Render assigns this)
      - key: PORT
        value: 10000
      
      # Database connection (from PostgreSQL service)
      - key: DATABASE_URL
        fromDatabase:
          name: PROJECT_NAME-db
          property: connectionString
      
      # JWT secret (will be set via CLI)
      - key: JWT_SECRET
        sync: false
      
      # Resend email API key (will be set via CLI)
      - key: RESEND_API_KEY
        sync: false
      
      # Stripe keys (will be set via CLI)
      - key: STRIPE_SECRET_KEY
        sync: false
      
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      
      # Telegram bot token (will be set via CLI)
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      
      # Twilio credentials (optional, will be set via CLI)
      - key: TWILIO_ACCOUNT_SID
        sync: false
      
      - key: TWILIO_AUTH_TOKEN
        sync: false
      
      - key: TWILIO_PHONE_NUMBER
        sync: false
      
      # Frontend URL for CORS
      - key: CORS_ORIGINS
        value: https://PROJECT_NAME.pages.dev
      
      - key: FRONTEND_URL
        value: https://PROJECT_NAME.pages.dev
      
      # Database SSL (required for Render PostgreSQL)
      - key: DB_SSL
        value: true
      
      # Resend from email
      - key: EMAIL_FROM
        value: noreply@PROJECT_NAME.com
      
      # App URL (backend)
      - key: APP_URL
        value: https://PROJECT_NAME-backend.onrender.com
    
    # Auto-deploy on git push
    autoDeploy: true
    
    # Health check configuration
    healthCheck:
      path: /api/health/live
      initialDelaySeconds: 30

# PostgreSQL database
databases:
  - name: PROJECT_NAME-db
    databaseName: PROJECT_NAME_production
    user: PROJECT_NAME_user
    plan: free
    region: oregon
```

**AI verification:**
```bash
test -f backend/render.yaml && echo "render.yaml created"
cat backend/render.yaml | grep -q "PROJECT_NAME-backend" && echo "Service name configured"
cat backend/render.yaml | grep -q "PROJECT_NAME-db" && echo "Database configured"
```

---

### Step 3.4: Update render.yaml with Actual Project Name

**AI replaces** all instances of `PROJECT_NAME` with actual project name:

```bash
cd backend
sed -i 's/PROJECT_NAME/actual-project-name/g' render.yaml
```

**AI verification:**
```bash
grep -c "PROJECT_NAME" render.yaml
# Should return 0 (no more placeholders)
```

---

## POSTGRESQL SCHEMA PREPARATION

### Step 3.5: Create PostgreSQL Schema File

**AI creates** `backend/schema.sql` for PostgreSQL:

```sql
-- PostgreSQL version of schema (differs from D1/SQLite)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'user' CHECK(role IN ('user', 'admin', 'support')),
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50),
  subscription_plan VARCHAR(50),
  telegram_id VARCHAR(50),
  telegram_username VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phone verification codes
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram support conversations
CREATE TABLE IF NOT EXISTS telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  telegram_chat_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK(status IN ('open', 'closed', 'pending')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram messages
CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES telegram_conversations(id) ON DELETE CASCADE,
  message_id VARCHAR(50) NOT NULL,
  from_user VARCHAR(20) NOT NULL CHECK(from_user IN ('user', 'support')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stripe subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment history
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_telegram_conversations_chat ON telegram_conversations(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_user ON telegram_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_status ON telegram_conversations(status);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_assigned ON telegram_conversations(assigned_to);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_conv ON telegram_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created ON telegram_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_conversations_updated_at 
  BEFORE UPDATE ON telegram_conversations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create initial admin user (password: Admin123!)
-- Password hash for "Admin123!" using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, name, role, email_verified)
VALUES (
  'admin@example.com',
  '$2b$10$rKvVLZ4JZKxGxH5qYz5qx.X5V8kJ9Xf5HQ5ZJQ5qY5qX5V8kJ9Xf5',
  'Administrator',
  'admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;
```

**AI verification:**
```bash
test -f backend/schema.sql && echo "PostgreSQL schema created"
wc -l backend/schema.sql
# Should show 200+ lines
```

---

## RENDER DEPLOYMENT

### Step 3.6: Commit Changes to Git

**AI must commit render.yaml and schema.sql:**

```bash
cd /path/to/project
git add backend/render.yaml backend/schema.sql
git commit -m "Add Render deployment configuration and PostgreSQL schema"
git push origin main
```

**AI verification:**
```bash
git log --oneline -1
# Should show the commit
```

---

### Step 3.7: Deploy to Render Using Blueprint

**AI executes:**
```bash
cd backend
render blueprint launch render.yaml
```

**Expected output:**
```
Creating services from blueprint...
✓ Creating database PROJECT_NAME-db
✓ Creating web service PROJECT_NAME-backend
✓ Linking database to web service

Your services:
  Web Service: https://PROJECT_NAME-backend.onrender.com
  Database: PROJECT_NAME-db

Deployment in progress...
```

**Wait time:** 3-5 minutes for initial deployment

**User action:** None, just wait

**AI monitors deployment:**
```bash
render services list
```

**AI waits until status shows "live":**
```bash
while true; do
  STATUS=$(render services info PROJECT_NAME-backend --json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "Status: $STATUS"
  if [ "$STATUS" = "live" ]; then
    break
  fi
  sleep 10
done
```

**AI stores:**
```
BACKEND_URL=https://PROJECT_NAME-backend.onrender.com
RENDER_SERVICE_NAME=PROJECT_NAME-backend
RENDER_DATABASE_NAME=PROJECT_NAME-db
```

---

### Step 3.8: Get Database Connection String

**AI executes:**
```bash
render databases info PROJECT_NAME-db --json
```

**AI extracts Internal Database URL:**
```bash
DATABASE_URL=$(render databases info PROJECT_NAME-db --json | grep -o '"connectionString":"[^"]*"' | cut -d'"' -f4)
echo $DATABASE_URL
```

**Expected format:**
```
postgresql://PROJECT_NAME_user:password@dpg-xxxxx.oregon-postgres.render.com:5432/PROJECT_NAME_production
```

**AI stores:**
```
DATABASE_URL=postgresql://...
```

---

## ENVIRONMENT VARIABLES SETUP

### Step 3.9: Set JWT_SECRET in Render

**AI uses JWT_SECRET from PART 2:**

```bash
render env set JWT_SECRET="$JWT_SECRET" --service PROJECT_NAME-backend
```

**Expected output:**
```
✓ Successfully set environment variable JWT_SECRET
```

---

### Step 3.10: Set RESEND_API_KEY in Render

**AI uses RESEND_API_KEY from PART 1:**

```bash
render env set RESEND_API_KEY="$RESEND_API_KEY" --service PROJECT_NAME-backend
```

**Expected output:**
```
✓ Successfully set environment variable RESEND_API_KEY
```

---

### Step 3.11: Set STRIPE_SECRET_KEY in Render

**AI uses STRIPE_SECRET_KEY from PART 1:**

```bash
render env set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --service PROJECT_NAME-backend
```

**Expected output:**
```
✓ Successfully set environment variable STRIPE_SECRET_KEY
```

---

### Step 3.12: Set TELEGRAM_BOT_TOKEN in Render

**AI uses TELEGRAM_BOT_TOKEN from PART 1:**

```bash
render env set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" --service PROJECT_NAME-backend
```

**Expected output:**
```
✓ Successfully set environment variable TELEGRAM_BOT_TOKEN
```

---

### Step 3.13: Set Twilio Credentials (if enabled)

**If SMS verification enabled in PART 1:**

```bash
render env set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" --service PROJECT_NAME-backend
render env set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" --service PROJECT_NAME-backend
render env set TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER" --service PROJECT_NAME-backend
```

---

### Step 3.14: Verify Environment Variables

**AI executes:**
```bash
render env list --service PROJECT_NAME-backend
```

**Expected output should include:**
```
JWT_SECRET=***
RESEND_API_KEY=***
STRIPE_SECRET_KEY=***
TELEGRAM_BOT_TOKEN=***
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://PROJECT_NAME.pages.dev
FRONTEND_URL=https://PROJECT_NAME.pages.dev
NODE_ENV=production
PORT=10000
```

**If Twilio enabled:**
```
TWILIO_ACCOUNT_SID=***
TWILIO_AUTH_TOKEN=***
TWILIO_PHONE_NUMBER=***
```

**AI counts environment variables:**
```bash
render env list --service PROJECT_NAME-backend | wc -l
# Should be >= 10 (more if Twilio enabled)
```

---

## DATABASE MIGRATION

### Step 3.15: Connect to PostgreSQL Database

**AI executes:**
```bash
render postgres connect PROJECT_NAME-db
```

**Expected output:**
```
Connecting to PROJECT_NAME-db...
psql (15.x)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256)
Type "help" for help.

PROJECT_NAME_production=>
```

**User sees:** PostgreSQL prompt

---

### Step 3.16: Run Database Migrations

**AI executes in psql prompt:**
```sql
\i schema.sql
```

**Expected output:**
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
... (many CREATE TABLE statements)
CREATE INDEX
CREATE INDEX
... (many CREATE INDEX statements)
CREATE FUNCTION
CREATE TRIGGER
CREATE TRIGGER
CREATE TRIGGER
INSERT 0 1
```

**AI verification in psql:**
```sql
\dt
```

**Expected output:**
```
                    List of relations
 Schema |          Name           | Type  |      Owner
--------+-------------------------+-------+-----------------
 public | audit_log               | table | PROJECT_NAME_user
 public | email_verifications     | table | PROJECT_NAME_user
 public | password_resets         | table | PROJECT_NAME_user
 public | payments                | table | PROJECT_NAME_user
 public | phone_verifications     | table | PROJECT_NAME_user
 public | sessions                | table | PROJECT_NAME_user
 public | subscriptions           | table | PROJECT_NAME_user
 public | telegram_conversations  | table | PROJECT_NAME_user
 public | telegram_messages       | table | PROJECT_NAME_user
 public | users                   | table | PROJECT_NAME_user
(10 rows)
```

**AI counts tables:**
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

**Expected result:**
```
 count
-------
    10
(1 row)
```

**AI exits psql:**
```sql
\q
```

---

### Step 3.17: Alternative Migration Method (if psql connection fails)

**If interactive psql doesn't work:**

**AI executes:**
```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

**Or using render CLI:**
```bash
render postgres query PROJECT_NAME-db --file backend/schema.sql
```

---

## BACKEND VERIFICATION

### Step 3.18: Trigger Render Deployment Restart

**After setting all environment variables, restart service:**

```bash
render services restart PROJECT_NAME-backend
```

**Expected output:**
```
✓ Successfully restarted PROJECT_NAME-backend
```

**Wait for restart (30-60 seconds):**
```bash
sleep 60
```

---

### Step 3.19: Check Backend Health Endpoint

**AI executes:**
```bash
curl https://PROJECT_NAME-backend.onrender.com/api/health/live
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "uptime": 123.456
}
```

**AI verification:**
```bash
curl -s https://PROJECT_NAME-backend.onrender.com/api/health/live | grep -q '"status":"ok"'
# Should return 0 (success)
```

---

### Step 3.20: Check Database Connection

**AI executes:**
```bash
curl https://PROJECT_NAME-backend.onrender.com/api/health/ready
```

**Expected output:**
```json
{
  "ready": true,
  "database": "connected",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

**AI verification:**
```bash
curl -s https://PROJECT_NAME-backend.onrender.com/api/health/ready | grep -q '"database":"connected"'
# Should return 0 (success)
```

---

### Step 3.21: View Backend Logs

**AI executes:**
```bash
render logs PROJECT_NAME-backend --tail 50
```

**AI looks for:**
- "Server running on port 10000"
- "PostgreSQL connected"
- "Health check endpoint ready"
- No error messages

**Expected log output:**
```
2025-01-09 12:00:00 [INFO] Server starting...
2025-01-09 12:00:01 [INFO] PostgreSQL connected
2025-01-09 12:00:01 [INFO] Server running on port 10000
2025-01-09 12:00:02 [INFO] Health check: OK
```

---

## UPDATE FRONTEND WITH BACKEND URL

### Step 3.22: Update Cloudflare Pages Environment Variable

**AI executes:**
```bash
npx wrangler pages project set PROJECT_NAME NEXT_PUBLIC_API_URL="https://PROJECT_NAME-backend.onrender.com"
```

**Expected output:**
```
✅ Successfully set NEXT_PUBLIC_API_URL
```

---

### Step 3.23: Redeploy Frontend

**AI executes:**
```bash
cd frontend
npm run build
npx wrangler pages deploy .next --project-name=PROJECT_NAME
```

**AI waits for deployment (1-2 minutes)**

---

### Step 3.24: Verify Frontend Can Connect to Backend

**AI executes:**
```bash
curl -s https://PROJECT_NAME.pages.dev | grep -o 'https://PROJECT_NAME-backend.onrender.com'
# Should find the backend URL in frontend code
```

---

## RENDER SETUP VERIFICATION

### Step 3.25: Final Render Checklist

**AI verifies:**

- [ ] Render CLI installed and authenticated
- [ ] render.yaml created and configured
- [ ] PostgreSQL schema created
- [ ] Changes committed to Git
- [ ] Blueprint deployed successfully
- [ ] PostgreSQL database created
- [ ] Backend service deployed
- [ ] All environment variables set (10+ variables)
- [ ] Database migrations completed
- [ ] 10 tables created in PostgreSQL
- [ ] Backend health endpoint returns OK
- [ ] Database connection works
- [ ] Backend logs show no errors
- [ ] Frontend updated with backend URL
- [ ] Frontend redeployed

**AI provides summary:**
```
Render.com Setup Complete!

Backend URL: https://PROJECT_NAME-backend.onrender.com
Database: PROJECT_NAME-db (PostgreSQL 15)

Environment variables set:
- DATABASE_URL (auto-configured)
- JWT_SECRET
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- TELEGRAM_BOT_TOKEN
- TWILIO_* (if enabled)
- CORS_ORIGINS
- FRONTEND_URL

Database tables: 10 created
Health checks: Passing
Logs: No errors

Frontend updated:
- NEXT_PUBLIC_API_URL set
- Redeployed to Cloudflare Pages

Next: PART 4 - Email and Payments Integration
```

---

## TROUBLESHOOTING RENDER ISSUES

### Issue: Blueprint deployment fails

**Check:**
```bash
render services list
render logs PROJECT_NAME-backend
```

**Solution:**
- Verify render.yaml syntax
- Check all environment variables
- Ensure package.json has correct scripts

---

### Issue: Database connection fails

**Check:**
```bash
render databases info PROJECT_NAME-db
psql "$DATABASE_URL" -c "SELECT 1"
```

**Solution:**
- Verify DATABASE_URL format
- Ensure DB_SSL=true is set
- Check if database is running

---

### Issue: Service won't start

**Check logs:**
```bash
render logs PROJECT_NAME-backend --tail 100
```

**Common causes:**
- Missing environment variables
- Wrong Node.js version
- Missing dependencies
- Port configuration issues

**Solution:**
- Set all required environment variables
- Specify Node version in package.json
- Run `npm install --production`
- Ensure PORT=10000 is set

---

# PART 4
## Email (Resend) and Payments (Stripe) Integration

Version: 4.0
Prerequisites: PART 1, 2, and 3 completed

---

## RESEND EMAIL INTEGRATION

### Step 4.1: Verify Resend API Key

**AI verifies key was set in PART 3:**
```bash
render env list --service PROJECT_NAME-backend | grep RESEND_API_KEY
```

**Expected output:**
```
RESEND_API_KEY=re_***
```

**AI also verifies in Cloudflare:**
```bash
npx wrangler secret list | grep RESEND_API_KEY
```

---

### Step 4.2: Test Resend API Connection

**AI executes test:**
```bash
curl https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

**Expected output:**
```json
{
  "data": []
}
```

**Or if domain already added:**
```json
{
  "data": [
    {
      "id": "d91cd9bd-1176-453e-8fc1-35364d380206",
      "name": "yourdomain.com",
      "status": "verified",
      "created_at": "2025-01-09T12:00:00.000Z"
    }
  ]
}
```

**AI verification:**
```bash
curl -s https://api.resend.com/domains -H "Authorization: Bearer $RESEND_API_KEY" | grep -q "data"
# Should return 0 (success)
```

---

### Step 4.3: Add Custom Domain to Resend (Optional but Recommended)

**AI asks user:**
```
Do you want to add a custom domain for sending emails?
This will make emails come from your domain instead of resend.dev
(yes/no)
```

**If yes:**

**AI asks:**
"What domain do you want to use for emails? (e.g., mail.yourdomain.com)"

**AI instructs user:**
```
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: mail.yourdomain.com
4. Click "Add"
5. You'll see DNS records to add
```

**AI provides DNS records user needs to add:**
```
You need to add these DNS records to Cloudflare:

SPF Record:
Type: TXT
Name: mail.yourdomain.com
Content: v=spf1 include:_spf.resend.com ~all

DKIM Record:
Type: TXT
Name: resend._domainkey.mail.yourdomain.com
Content: (copy from Resend dashboard)

DMARC Record:
Type: TXT
Name: _dmarc.mail.yourdomain.com
Content: v=DMARC1; p=none; pct=100; rua=mailto:dmarc@yourdomain.com
```

**If user has Cloudflare account, AI can add records via API:**
```bash
# Get Zone ID
ZONE_ID=$(npx wrangler zones list | grep yourdomain.com | awk '{print $1}')

# Add SPF record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "mail.yourdomain.com",
    "content": "v=spf1 include:_spf.resend.com ~all"
  }'
```

**User must wait 5-10 minutes for DNS propagation, then:**

**AI instructs:**
```
Go back to Resend dashboard and click "Verify DNS Records"
```

---

### Step 4.4: Update EMAIL_FROM in Render

**If custom domain added:**
```bash
render env set EMAIL_FROM="noreply@mail.yourdomain.com" --service PROJECT_NAME-backend
```

**If using default:**
```bash
render env set EMAIL_FROM="onboarding@resend.dev" --service PROJECT_NAME-backend
```

---

### Step 4.5: Test Email Sending

**AI creates test endpoint (should already exist from generated code):**

Check if `backend/src/routes/test.js` exists:
```bash
test -f backend/src/routes/test.js && echo "Test routes exist"
```

**If not, AI creates it:**
```javascript
import express from 'express';
import { sendEmail, emailTemplates } from '../services/emailService.js';

const router = express.Router();

router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const result = await sendEmail({
      to: email,
      ...emailTemplates.welcome('Test User')
    });
    
    res.json({ 
      success: true, 
      id: result.id,
      message: 'Email sent successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**AI commits and pushes:**
```bash
git add backend/src/routes/test.js
git commit -m "Add email testing endpoint"
git push origin main
```

**Wait for Render auto-deploy (2-3 minutes):**
```bash
sleep 180
```

**AI tests email sending:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected output:**
```json
{
  "success": true,
  "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
  "message": "Email sent successfully"
}
```

**AI verification:**
```bash
curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | grep -q '"success":true'
# Should return 0 (success)
```

**AI instructs user:**
```
Check the inbox of test@example.com for the welcome email.
If not received:
1. Check spam folder
2. Check Resend logs at https://resend.com/logs
3. Verify RESEND_API_KEY is correct
```

---

### Step 4.6: Verify Email Templates

**AI checks that emailService.js has all templates:**

```bash
grep -A 5 "emailTemplates" backend/src/services/emailService.js
```

**Should include:**
- welcome
- emailVerification
- passwordReset
- passwordChanged
- subscriptionCreated
- subscriptionCancelled
- paymentSucceeded
- paymentFailed

**AI verification:**
```bash
grep -c "export const emailTemplates" backend/src/services/emailService.js
# Should return 1 or more
```

---

## STRIPE PAYMENTS INTEGRATION

### Step 4.7: Verify Stripe Keys

**AI verifies keys were set in PART 3:**

**Backend (secret key):**
```bash
render env list --service PROJECT_NAME-backend | grep STRIPE_SECRET_KEY
```

**Expected output:**
```
STRIPE_SECRET_KEY=sk_test_***
```

**Frontend (publishable key):**
```bash
npx wrangler pages project list PROJECT_NAME
```

Should show `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

### Step 4.8: Test Stripe API Connection

**AI executes:**
```bash
curl https://api.stripe.com/v1/customers?limit=1 \
  -u "$STRIPE_SECRET_KEY:"
```

**Expected output:**
```json
{
  "object": "list",
  "data": [],
  "has_more": false,
  "url": "/v1/customers"
}
```

**AI verification:**
```bash
curl -s https://api.stripe.com/v1/customers?limit=1 -u "$STRIPE_SECRET_KEY:" | grep -q '"object":"list"'
# Should return 0 (success)
```

---

### Step 4.9: Create Stripe Products and Prices

**AI asks user:**
```
Do you want me to create test products and prices in Stripe?
(yes/no)
```

**If yes:**

**AI creates basic subscription plans via Stripe API:**

```bash
# Create product: Pro Plan
PRODUCT_ID=$(curl -s https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="Pro Plan" \
  -d description="Professional subscription with all features" \
  | grep -o '"id":"prod_[^"]*"' | cut -d'"' -f4)

echo "Product ID: $PRODUCT_ID"

# Create monthly price
PRICE_MONTHLY=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="$PRODUCT_ID" \
  -d unit_amount=2000 \
  -d currency=usd \
  -d "recurring[interval]"=month \
  | grep -o '"id":"price_[^"]*"' | cut -d'"' -f4)

echo "Monthly Price ID: $PRICE_MONTHLY"

# Create yearly price
PRICE_YEARLY=$(curl -s https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product="$PRODUCT_ID" \
  -d unit_amount=20000 \
  -d currency=usd \
  -d "recurring[interval]"=year \
  | grep -o '"id":"price_[^"]*"' | cut -d'"' -f4)

echo "Yearly Price ID: $PRICE_YEARLY"
```

**AI stores:**
```
STRIPE_PRODUCT_ID=prod_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

**AI updates config file** `backend/src/config/stripe.js`:
```javascript
export const STRIPE_PRICES = {
  pro_monthly: 'price_...',
  pro_yearly: 'price_...',
};

export const STRIPE_PRODUCTS = {
  pro: 'prod_...',
};
```

**AI commits:**
```bash
git add backend/src/config/stripe.js
git commit -m "Add Stripe product and price IDs"
git push origin main
```

**If no:**

**AI instructs user:**
```
You can create products manually:
1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Name: Pro Plan
4. Price: $20/month (or your price)
5. Recurring: Monthly
6. Click "Save product"
7. Copy the Price ID (starts with price_)
8. Update backend/src/config/stripe.js with the Price ID
```

---

### Step 4.10: Setup Stripe Webhook

**AI instructs user:**
```
We need to set up Stripe webhook for payment events.

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: https://PROJECT_NAME-backend.onrender.com/api/webhooks/stripe
4. Description: Payment webhooks
5. Events to send: Click "Select events"
6. Select these events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
   - payment_intent.succeeded
   - payment_intent.payment_failed
7. Click "Add events"
8. Click "Add endpoint"
9. Click on the webhook you just created
10. Click "Reveal" next to "Signing secret"
11. Copy the signing secret (starts with whsec_)
```

**AI asks:**
"Please paste your Stripe webhook signing secret (whsec_...):"

**AI stores** and sets in Render:
```bash
render env set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" --service PROJECT_NAME-backend
```

**AI also sets in Cloudflare:**
```bash
echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

**AI verification:**
```bash
render env list --service PROJECT_NAME-backend | grep STRIPE_WEBHOOK_SECRET
# Should show: STRIPE_WEBHOOK_SECRET=whsec_***
```

---

### Step 4.11: Test Stripe Webhook Endpoint

**AI executes:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

**Expected output:**
```json
{
  "error": "No signatures found"
}
```

**This is correct - webhook endpoint exists but rejects unsigned requests**

**AI verification:**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://PROJECT_NAME-backend.onrender.com/api/webhooks/stripe
# Should return 400 (Bad Request) not 404
```

---

### Step 4.12: Test Stripe Webhook from Dashboard

**AI instructs user:**
```
Let's test the webhook:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event: checkout.session.completed
5. Click "Send test webhook"
6. You should see a "200 OK" response
```

**AI checks backend logs:**
```bash
render logs PROJECT_NAME-backend --tail 20 | grep webhook
```

**Expected log:**
```
Webhook received: checkout.session.completed
Processing checkout session...
```

---

### Step 4.13: Create Test Checkout Session

**AI creates test route (if not exists):**

```javascript
router.post('/test-checkout', async (req, res) => {
  try {
    const session = await createCheckoutSession({
      priceId: 'price_...', // Use STRIPE_PRICE_MONTHLY
      userId: 'test-user-123',
      customerEmail: 'test@example.com'
    });
    
    res.json({ 
      url: session.url,
      id: session.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**AI tests:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-checkout \
  -H "Content-Type: application/json"
```

**Expected output:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "id": "cs_test_..."
}
```

**AI verification:**
```bash
curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-checkout \
  -H "Content-Type: application/json" | grep -q "https://checkout.stripe.com"
# Should return 0 (success)
```

**AI instructs user:**
```
Test the checkout flow:
1. Open this URL in browser: [checkout URL from above]
2. Use test card: 4242 4242 4242 4242
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Complete the checkout
6. You should be redirected to success page
7. Check Stripe dashboard for the payment
```

---

### Step 4.14: Verify Stripe Integration in Database

**AI connects to database:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM subscriptions"
```

**After user completes test checkout, should show:**
```
 count
-------
     1
(1 row)
```

**AI also checks:**
```bash
psql "$DATABASE_URL" -c "SELECT * FROM subscriptions LIMIT 1"
```

**Should show subscription record with:**
- stripe_subscription_id
- stripe_customer_id
- status = 'active'
- plan name
- current_period_start/end

---

## INTEGRATION VERIFICATION

### Step 4.15: Test Full User Registration Flow with Email

**AI creates test script:**

```bash
# Register user
RESPONSE=$(curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"Test1234!",
    "name":"Test User"
  }')

echo "Registration response: $RESPONSE"

# Extract user ID and token
USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "User ID: $USER_ID"
echo "Token: $TOKEN"
```

**Expected:**
1. User created in database
2. Welcome email sent automatically
3. JWT token returned

**AI verifies database:**
```bash
psql "$DATABASE_URL" -c "SELECT email, name, email_verified FROM users WHERE email='testuser@example.com'"
```

**Expected output:**
```
       email          |   name    | email_verified
----------------------+-----------+----------------
 testuser@example.com | Test User | f
(1 row)
```

**AI instructs user:**
```
Check testuser@example.com inbox for welcome email.
Email should arrive within 1-2 minutes.
```

---

### Step 4.16: Test Email Verification Flow

**AI creates verification token:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**AI instructs user:**
```
1. Check testuser@example.com inbox
2. Find "Verify your email" email
3. Click verification link
4. Should redirect to app with success message
```

---

### Step 4.17: Test Password Reset Flow

**AI triggers password reset:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

**Expected:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**AI instructs user:**
```
1. Check testuser@example.com inbox
2. Find "Reset your password" email
3. Click reset link
4. Should redirect to password reset page
```

---

## EMAIL AND PAYMENTS CHECKLIST

### Step 4.18: Final Verification

**AI verifies:**

**Email Integration:**
- [ ] RESEND_API_KEY set in Render and Cloudflare
- [ ] Custom domain added (optional)
- [ ] DNS records configured (if custom domain)
- [ ] EMAIL_FROM configured
- [ ] Test email sends successfully
- [ ] Email templates exist
- [ ] Welcome email works
- [ ] Verification email works
- [ ] Password reset email works
- [ ] Emails appear in inbox (not spam)

**Stripe Integration:**
- [ ] STRIPE_SECRET_KEY set in Render and Cloudflare
- [ ] STRIPE_PUBLISHABLE_KEY set in frontend
- [ ] Stripe API connection works
- [ ] Products and prices created
- [ ] Webhook endpoint configured
- [ ] STRIPE_WEBHOOK_SECRET set
- [ ] Webhook receives events
- [ ] Test checkout session creates
- [ ] Test payment completes
- [ ] Subscription saved to database
- [ ] Payment webhook processed correctly

**AI provides summary:**
```
Email and Payments Integration Complete!

Resend:
- API Key: Configured
- Domain: [your domain or resend.dev]
- Test email: Sent successfully
- Templates: 8 templates ready

Stripe:
- API Keys: Configured
- Products: X products created
- Prices: Y prices created
- Webhook: Configured and tested
- Test payment: Successful

All integrations tested and working!

Next: PART 5 - Telegram Bot and SMS Integration
```

---

# PART 5
## Telegram Bot and SMS (Twilio) Integration

Version: 4.0
Prerequisites: PART 1, 2, 3, and 4 completed

---

## TELEGRAM BOT SETUP

### Step 5.1: Verify Telegram Bot Token

**AI verifies token was set in PART 3:**
```bash
render env list --service PROJECT_NAME-backend | grep TELEGRAM_BOT_TOKEN
```

**Expected output:**
```
TELEGRAM_BOT_TOKEN=123456789:ABC***
```

**AI also verifies in Cloudflare:**
```bash
npx wrangler secret list | grep TELEGRAM_BOT_TOKEN
```

---

### Step 5.2: Test Telegram Bot API Connection

**AI executes:**
```bash
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe
```

**Expected output:**
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Project Support Bot",
    "username": "project_support_bot",
    "can_join_groups": true,
    "can_read_all_group_messages": false,
    "supports_inline_queries": false
  }
}
```

**AI stores:**
```
TELEGRAM_BOT_ID=123456789
TELEGRAM_BOT_USERNAME=project_support_bot
```

**AI verification:**
```bash
curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe | grep -q '"ok":true'
# Should return 0 (success)
```

---

### Step 5.3: Set Telegram Webhook

**AI sets webhook to backend:**
```bash
curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram\"}"
```

**Expected output:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

**AI verification:**
```bash
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo
```

**Expected output:**
```json
{
  "ok": true,
  "result": {
    "url": "https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**AI verifies webhook URL is correct:**
```bash
curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo | \
  grep -q "PROJECT_NAME-backend.onrender.com"
# Should return 0 (success)
```

---

### Step 5.4: Set Bot Commands

**AI sets bot commands for user interface:**
```bash
curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setMyCommands \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Start conversation"},
      {"command": "help", "description": "Show help message"},
      {"command": "register", "description": "Link your account"},
      {"command": "support", "description": "Contact support"},
      {"command": "status", "description": "Check your account status"},
      {"command": "cancel", "description": "Cancel current operation"}
    ]
  }'
```

**Expected output:**
```json
{
  "ok": true,
  "result": true
}
```

**AI verification:**
```bash
curl -s https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMyCommands | grep -q "start"
# Should return 0 (success)
```

---

### Step 5.5: Test Telegram Webhook Endpoint

**AI tests webhook endpoint:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "text": "/start"
    }
  }'
```

**Expected output:**
```json
{
  "ok": true
}
```

**AI verification:**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram
# Should return 200
```

---

### Step 5.6: Create Test Telegram Conversation

**AI instructs user:**
```
Let's test the Telegram bot:

1. Open Telegram app
2. Search for: @project_support_bot (use your bot's username)
3. Click on the bot
4. Click "Start" or send /start
5. Bot should respond with welcome message

Expected response:
"Welcome to Project Support!

I can help you with:
- Account registration
- Support requests
- Status updates

Available commands:
/help - Show this message
/register - Link your account
/support - Contact support
/status - Check account status"
```

**User action:** Start conversation with bot

**AI checks backend logs:**
```bash
render logs PROJECT_NAME-backend --tail 20 | grep telegram
```

**Expected logs:**
```
Telegram webhook received
Processing /start command
User: testuser (123456789)
Sending welcome message
```

---

### Step 5.7: Test Bot Commands

**AI instructs user to test each command:**

**/help command:**
```
User sends: /help
Bot responds with: Help information and available commands
```

**/register command:**
```
User sends: /register
Bot responds with: Instructions to link account or registration link
```

**/support command:**
```
User sends: /support
Bot responds with: "Please describe your issue. A support agent will respond shortly."
Creates support ticket in database
```

**/status command:**
```
User sends: /status
Bot responds with: Account status or "You haven't registered yet"
```

**AI verifies conversations in database:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM telegram_conversations"
```

**Should show at least 1 conversation:**
```
 count
-------
     1
(1 row)
```

**AI checks conversation details:**
```bash
psql "$DATABASE_URL" -c "SELECT telegram_chat_id, status FROM telegram_conversations ORDER BY created_at DESC LIMIT 1"
```

**Expected:**
```
 telegram_chat_id |  status
------------------+---------
 123456789        | open
(1 row)
```

---

### Step 5.8: Test Account Linking via Telegram

**AI creates account link endpoint (should exist in generated code):**

Check `backend/src/routes/telegram.js`:
```bash
test -f backend/src/routes/telegram.js && echo "Telegram routes exist"
```

**AI tests account linking flow:**

**User (in Telegram):** Sends `/register`

**Bot responds with:** 
```
To link your account, please click this link:
https://PROJECT_NAME.pages.dev/telegram/link?token=abc123...

Or reply with your email address.
```

**AI verifies link token created:**
```bash
psql "$DATABASE_URL" -c "SELECT token FROM telegram_link_tokens ORDER BY created_at DESC LIMIT 1"
```

**User clicks link and logs in on website:**
```bash
# Test the link endpoint
curl https://PROJECT_NAME-backend.onrender.com/api/telegram/link \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "userId": "user-uuid"
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Account linked successfully"
}
```

**AI verifies user updated in database:**
```bash
psql "$DATABASE_URL" -c "SELECT telegram_id, telegram_username FROM users WHERE telegram_id IS NOT NULL"
```

**Should show linked account:**
```
 telegram_id | telegram_username
-------------+------------------
 123456789   | testuser
(1 row)
```

---

### Step 5.9: Test Support Ticket Creation

**AI instructs user:**
```
In Telegram, send: /support
Then send: "I need help with my account"
```

**Expected flow:**
1. User sends `/support`
2. Bot: "Please describe your issue"
3. User sends message
4. Bot: "Your support ticket #123 has been created"
5. Database: New conversation and messages created

**AI verifies in database:**
```bash
psql "$DATABASE_URL" -c "SELECT id, status FROM telegram_conversations WHERE status='open'"
```

**AI checks messages:**
```bash
psql "$DATABASE_URL" -c "SELECT from_user, content FROM telegram_messages ORDER BY created_at DESC LIMIT 5"
```

**Expected:**
```
 from_user |           content
-----------+------------------------------
 user      | I need help with my account
 support   | Your ticket has been created
 user      | /support
(3 rows)
```

---

### Step 5.10: Test Admin Notification

**When support ticket created, admin should receive notification:**

**AI checks if admin user exists:**
```bash
psql "$DATABASE_URL" -c "SELECT email, telegram_id FROM users WHERE role='admin'"
```

**If admin has telegram_id, bot sends notification:**

**AI checks logs:**
```bash
render logs PROJECT_NAME-backend --tail 50 | grep "admin notification"
```

**Expected log:**
```
Sending admin notification for ticket #123
Admin notified via Telegram
```

---

## TWILIO SMS INTEGRATION (Optional)

### Step 5.11: Check if SMS Enabled

**AI checks:**
```bash
render env list --service PROJECT_NAME-backend | grep TWILIO
```

**If TWILIO variables exist, continue with SMS setup**
**If not, skip to Step 5.19**

---

### Step 5.12: Verify Twilio Credentials

**AI checks all Twilio variables:**
```bash
render env list --service PROJECT_NAME-backend | grep TWILIO
```

**Expected output:**
```
TWILIO_ACCOUNT_SID=AC***
TWILIO_AUTH_TOKEN=***
TWILIO_PHONE_NUMBER=+1***
```

---

### Step 5.13: Test Twilio API Connection

**AI executes:**
```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

**Expected output:**
```json
{
  "sid": "AC...",
  "friendly_name": "Account Name",
  "status": "active",
  "type": "Full"
}
```

**AI verification:**
```bash
curl -s -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" | grep -q '"status":"active"'
# Should return 0 (success)
```

---

### Step 5.14: Test SMS Sending

**AI creates test endpoint (should exist):**

Check `backend/src/routes/test.js`:
```bash
grep -q "test-sms" backend/src/routes/test.js && echo "SMS test route exists"
```

**AI tests SMS sending:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-sms \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"+1234567890\"}"
```

**Expected output:**
```json
{
  "success": true,
  "sid": "SM...",
  "message": "Test SMS sent successfully"
}
```

**AI verification:**
```bash
curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-sms \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"+1234567890\"}" | grep -q '"success":true'
# Should return 0 (success)
```

**AI instructs user:**
```
Check your phone for test SMS.
If using trial account, phone must be verified in Twilio console.
```

---

### Step 5.15: Test Phone Verification Flow

**AI tests complete phone verification:**

**Step 1: Request verification code**
```bash
RESPONSE=$(curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/phone/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"phone":"+1234567890"}')

echo $RESPONSE
```

**Expected output:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 300
}
```

**AI instructs user:**
```
Check your phone for verification code SMS.
Code format: 6 digits (e.g., 123456)
Code expires in 5 minutes.
```

**Step 2: Verify code**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/phone/verify-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "phone":"+1234567890",
    "code":"123456"
  }'
```

**Expected output:**
```json
{
  "success": true,
  "message": "Phone verified successfully"
}
```

**AI verifies in database:**
```bash
psql "$DATABASE_URL" -c "SELECT phone, phone_verified FROM users WHERE phone='+1234567890'"
```

**Expected:**
```
     phone      | phone_verified
----------------+----------------
 +1234567890    | t
(1 row)
```

---

### Step 5.16: Test SMS Rate Limiting

**AI tests multiple SMS sends:**
```bash
for i in {1..5}; do
  curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/phone/send-code \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"phone":"+1234567890"}'
  sleep 1
done
```

**Expected:**
- First 2-3 requests: Success
- Subsequent requests: Rate limit error

**Expected error after rate limit:**
```json
{
  "error": "Too many verification attempts. Please try again later."
}
```

**AI verification:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM phone_verifications WHERE phone='+1234567890' AND created_at > NOW() - INTERVAL '1 hour'"
```

**Should show limited number of attempts**

---

### Step 5.17: Test SMS in Registration Flow

**AI tests new user registration with phone:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"smsuser@example.com",
    "password":"Test1234!",
    "name":"SMS Test User",
    "phone":"+1234567890"
  }'
```

**Expected:**
1. User created
2. Welcome email sent
3. Phone verification SMS sent automatically

**AI checks logs:**
```bash
render logs PROJECT_NAME-backend --tail 20 | grep "SMS"
```

**Expected logs:**
```
User registered: smsuser@example.com
Sending phone verification SMS to +1234567890
SMS sent successfully: SM...
```

---

### Step 5.18: Verify SMS Templates

**AI checks SMS service has all templates:**
```bash
grep -A 5 "smsTemplates" backend/src/services/smsService.js
```

**Should include:**
- phoneVerification
- passwordReset
- loginAlert
- subscriptionReminder

---

## TELEGRAM AND SMS VERIFICATION

### Step 5.19: Complete Integration Test

**AI runs full integration test:**

**Test 1: User registers with phone**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"fulltest@example.com",
    "password":"Test1234!",
    "name":"Full Test User",
    "phone":"+1234567890"
  }'
```

**Expected:**
- User created
- Email sent (welcome)
- SMS sent (verification code)
- Database record created

**Test 2: User links Telegram**
```
User opens Telegram bot
User sends: /register
User clicks link or enters email
Account linked
```

**Expected:**
- telegram_id updated in users table
- User can now receive support via Telegram

**Test 3: User verifies phone**
```bash
# Assuming user received code "123456"
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/phone/verify-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone":"+1234567890",
    "code":"123456"
  }'
```

**Expected:**
- phone_verified = true
- SMS confirmation sent

**Test 4: User creates support ticket**
```
User sends in Telegram: /support
User sends: "Test support ticket"
```

**Expected:**
- Support ticket created
- Admin notified (if admin has Telegram)
- Conversation stored in database

**AI verifies all in database:**
```bash
psql "$DATABASE_URL" << 'EOF'
SELECT 
  u.email,
  u.email_verified,
  u.phone_verified,
  u.telegram_id IS NOT NULL as telegram_linked,
  COUNT(tc.id) as support_tickets
FROM users u
LEFT JOIN telegram_conversations tc ON tc.user_id = u.id
WHERE u.email = 'fulltest@example.com'
GROUP BY u.id, u.email, u.email_verified, u.phone_verified, u.telegram_id;
EOF
```

**Expected output:**
```
       email         | email_verified | phone_verified | telegram_linked | support_tickets
---------------------+----------------+----------------+-----------------+----------------
 fulltest@example.com| t              | t              | t               | 1
(1 row)
```

---

### Step 5.20: Test Notification Delivery

**AI tests all notification channels:**

**Email notification:**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-uuid",
    "type":"email",
    "message":"Test notification"
  }'
```

**Telegram notification (if user has telegram_id):**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-uuid",
    "type":"telegram",
    "message":"Test notification"
  }'
```

**SMS notification (if user has verified phone):**
```bash
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/test/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-uuid",
    "type":"sms",
    "message":"Test notification"
  }'
```

**Expected:**
- All three channels deliver notification
- User receives message via email, Telegram, and SMS

---

## TELEGRAM AND SMS CHECKLIST

### Step 5.21: Final Verification

**AI verifies:**

**Telegram Bot:**
- [ ] TELEGRAM_BOT_TOKEN set in Render and Cloudflare
- [ ] Bot API connection works
- [ ] Webhook URL set correctly
- [ ] Bot commands configured
- [ ] /start command works
- [ ] /help command works
- [ ] /register command works
- [ ] /support command works
- [ ] Account linking works
- [ ] Support tickets created
- [ ] Admin notifications work
- [ ] Messages stored in database
- [ ] Conversations tracked properly

**Twilio SMS (if enabled):**
- [ ] TWILIO credentials set in Render
- [ ] Twilio API connection works
- [ ] Test SMS sends successfully
- [ ] Phone verification flow works
- [ ] Verification codes sent
- [ ] Codes validated correctly
- [ ] Rate limiting works
- [ ] SMS templates configured
- [ ] Phone verified in database
- [ ] SMS notifications work

**AI provides summary:**
```
Telegram and SMS Integration Complete!

Telegram Bot:
- Bot: @project_support_bot
- Webhook: Configured
- Commands: 6 commands available
- Account linking: Working
- Support tickets: Working
- Database: Conversations tracked

Twilio SMS (if enabled):
- Phone: +1234567890
- Verification: Working
- Rate limiting: Active
- Templates: 4 templates ready

All communication channels tested and working!

Next: PART 6 - Final Verification and Testing
```

---
# PART 6
## Final Verification, Complete Testing, and Domain Setup

Version: 4.0
Prerequisites: PART 1, 2, 3, 4, and 5 completed

---

## COMPLETE SYSTEM VERIFICATION

### Step 6.1: Health Checks - All Services

**AI runs comprehensive health check:**

**Backend health:**
```bash
curl https://PROJECT_NAME-backend.onrender.com/api/health/live
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Database health:**
```bash
curl https://PROJECT_NAME-backend.onrender.com/api/health/ready
```

**Expected:**
```json
{
  "ready": true,
  "database": "connected",
  "redis": "connected",
  "services": {
    "email": "ok",
    "sms": "ok",
    "stripe": "ok",
    "telegram": "ok"
  }
}
```

**Frontend health:**
```bash
curl -I https://PROJECT_NAME.pages.dev
```

**Expected:**
```
HTTP/2 200
content-type: text/html
...
```

**AI verification script:**
```bash
#!/bin/bash
BACKEND_URL="https://PROJECT_NAME-backend.onrender.com"
FRONTEND_URL="https://PROJECT_NAME.pages.dev"

echo "Checking backend health..."
BACKEND_STATUS=$(curl -s $BACKEND_URL/api/health/live | grep -o '"status":"ok"')
if [ -z "$BACKEND_STATUS" ]; then
  echo "❌ Backend health check failed"
  exit 1
else
  echo "✅ Backend is healthy"
fi

echo "Checking database..."
DB_STATUS=$(curl -s $BACKEND_URL/api/health/ready | grep -o '"database":"connected"')
if [ -z "$DB_STATUS" ]; then
  echo "❌ Database connection failed"
  exit 1
else
  echo "✅ Database is connected"
fi

echo "Checking frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" != "200" ]; then
  echo "❌ Frontend is not accessible"
  exit 1
else
  echo "✅ Frontend is accessible"
fi

echo ""
echo "All health checks passed! ✅"
```

---

### Step 6.2: Database Integrity Check

**AI verifies all tables exist:**
```bash
psql "$DATABASE_URL" << 'EOF'
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
EOF
```

**Expected output (10 tables):**
```
       table_name        | column_count
-------------------------+--------------
 audit_log               | 9
 email_verifications     | 6
 password_resets         | 6
 payments                | 7
 phone_verifications     | 8
 sessions                | 7
 subscriptions           | 10
 telegram_conversations  | 7
 telegram_messages       | 5
 users                   | 16
(10 rows)
```

**AI counts total rows:**
```bash
psql "$DATABASE_URL" << 'EOF'
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
```

**AI verifies indexes:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'"
```

**Should show 30+ indexes**

---

### Step 6.3: Environment Variables Audit

**AI creates audit script:**

```bash
#!/bin/bash

echo "=== Render Backend Environment Variables ==="
render env list --service PROJECT_NAME-backend | grep -v "^$"

echo ""
echo "=== Cloudflare Secrets ==="
npx wrangler secret list

echo ""
echo "=== Cloudflare Pages Environment Variables ==="
npx wrangler pages project list PROJECT_NAME

echo ""
echo "=== Required Variables Checklist ==="

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "RESEND_API_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "TELEGRAM_BOT_TOKEN"
  "CORS_ORIGINS"
  "FRONTEND_URL"
  "NODE_ENV"
  "PORT"
)

for var in "${REQUIRED_VARS[@]}"; do
  if render env list --service PROJECT_NAME-backend | grep -q "$var"; then
    echo "✅ $var"
  else
    echo "❌ $var - MISSING"
  fi
done
```

**AI verifies all required variables present**

---

## END-TO-END USER FLOW TESTING

### Step 6.4: Test Complete Registration Flow

**AI creates comprehensive test:**

```bash
#!/bin/bash
BASE_URL="https://PROJECT_NAME-backend.onrender.com"
TEST_EMAIL="e2etest@example.com"
TEST_PASSWORD="Test1234!"
TEST_PHONE="+1234567890"

echo "=== Step 1: User Registration ==="
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"$TEST_PASSWORD\",
    \"name\":\"E2E Test User\",
    \"phone\":\"$TEST_PHONE\"
  }")

echo $REGISTER_RESPONSE

USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  exit 1
else
  echo "✅ User registered successfully"
  echo "User ID: $USER_ID"
  echo "Token: ${TOKEN:0:20}..."
fi

sleep 2

echo ""
echo "=== Step 2: Email Verification ==="
# In production, user would click link in email
# For test, we'll get the token directly from database
VERIFY_TOKEN=$(psql "$DATABASE_URL" -t -c "SELECT token FROM email_verifications WHERE user_id='$USER_ID' ORDER BY created_at DESC LIMIT 1" | tr -d ' ')

if [ -z "$VERIFY_TOKEN" ]; then
  echo "⚠️  No verification token found"
else
  echo "Verification token: ${VERIFY_TOKEN:0:20}..."
  
  VERIFY_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/verify-email \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$VERIFY_TOKEN\"}")
  
  echo $VERIFY_RESPONSE
  
  if echo $VERIFY_RESPONSE | grep -q "success"; then
    echo "✅ Email verified"
  else
    echo "❌ Email verification failed"
  fi
fi

sleep 2

echo ""
echo "=== Step 3: Phone Verification ==="
PHONE_CODE_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/phone/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"phone\":\"$TEST_PHONE\"}")

echo $PHONE_CODE_RESPONSE

if echo $PHONE_CODE_RESPONSE | grep -q "success"; then
  echo "✅ Phone verification code sent"
  
  # Get code from database (in production user receives via SMS)
  PHONE_CODE=$(psql "$DATABASE_URL" -t -c "SELECT code FROM phone_verifications WHERE user_id='$USER_ID' ORDER BY created_at DESC LIMIT 1" | tr -d ' ')
  echo "Code: $PHONE_CODE"
  
  sleep 1
  
  VERIFY_PHONE_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/phone/verify-code \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"phone\":\"$TEST_PHONE\",\"code\":\"$PHONE_CODE\"}")
  
  echo $VERIFY_PHONE_RESPONSE
  
  if echo $VERIFY_PHONE_RESPONSE | grep -q "success"; then
    echo "✅ Phone verified"
  else
    echo "❌ Phone verification failed"
  fi
else
  echo "⚠️  Phone verification skipped (SMS not enabled)"
fi

sleep 2

echo ""
echo "=== Step 4: Profile Access ==="
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/api/users/me \
  -H "Authorization: Bearer $TOKEN")

echo $PROFILE_RESPONSE

if echo $PROFILE_RESPONSE | grep -q "$TEST_EMAIL"; then
  echo "✅ Profile accessed successfully"
else
  echo "❌ Profile access failed"
fi

sleep 2

echo ""
echo "=== Step 5: Create Checkout Session ==="
CHECKOUT_RESPONSE=$(curl -s -X POST $BASE_URL/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"priceId\":\"price_test_123\"}")

echo $CHECKOUT_RESPONSE

if echo $CHECKOUT_RESPONSE | grep -q "checkout.stripe.com"; then
  echo "✅ Checkout session created"
  CHECKOUT_URL=$(echo $CHECKOUT_RESPONSE | grep -o 'https://checkout.stripe.com/[^"]*')
  echo "Checkout URL: $CHECKOUT_URL"
else
  echo "⚠️  Checkout creation skipped or failed"
fi

echo ""
echo "=== Summary ==="
echo "Registration: ✅"
echo "Email Verification: $([ -n "$VERIFY_TOKEN" ] && echo '✅' || echo '⚠️')"
echo "Phone Verification: $([ -n "$PHONE_CODE" ] && echo '✅' || echo '⚠️')"
echo "Profile Access: ✅"
echo "Payment Flow: $(echo $CHECKOUT_RESPONSE | grep -q 'stripe' && echo '✅' || echo '⚠️')"

echo ""
echo "Test user created:"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo "User ID: $USER_ID"
```

**AI executes this script and verifies all steps pass**

---

### Step 6.5: Test Admin Panel Access

**AI tests admin functionality:**

**Login as admin:**
```bash
ADMIN_RESPONSE=$(curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"Admin123!"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
```

**List all users (admin only):**
```bash
curl -s -X GET https://PROJECT_NAME-backend.onrender.com/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected:**
```json
{
  "users": [
    {
      "id": "...",
      "email": "admin@example.com",
      "name": "Administrator",
      "role": "admin"
    },
    {
      "id": "...",
      "email": "e2etest@example.com",
      "name": "E2E Test User",
      "role": "user"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2
  }
}
```

**View support tickets (admin only):**
```bash
curl -s -X GET https://PROJECT_NAME-backend.onrender.com/api/admin/tickets \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**View analytics (admin only):**
```bash
curl -s -X GET https://PROJECT_NAME-backend.onrender.com/api/admin/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Step 6.6: Test Error Handling

**AI tests error scenarios:**

**Invalid credentials:**
```bash
curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

**Expected:**
```json
{
  "error": "Invalid credentials"
}
```

**Missing required fields:**
```bash
curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected:**
```json
{
  "error": "Missing required fields",
  "required": ["email", "password", "name"]
}
```

**Invalid token:**
```bash
curl -s -X GET https://PROJECT_NAME-backend.onrender.com/api/users/me \
  -H "Authorization: Bearer invalid_token"
```

**Expected:**
```json
{
  "error": "Invalid or expired token"
}
```

**Rate limiting:**
```bash
for i in {1..20}; do
  curl -s -X POST https://PROJECT_NAME-backend.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done
wait
```

**Expected:** Some requests return rate limit error

---

## FRONTEND TESTING

### Step 6.7: Test Frontend Routes

**AI tests all frontend pages:**

```bash
FRONTEND_URL="https://PROJECT_NAME.pages.dev"

echo "Testing frontend routes..."

# Homepage
echo "- Homepage"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL
# Expected: 200

# Login page
echo "- Login page"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/login
# Expected: 200

# Register page
echo "- Register page"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/register
# Expected: 200

# Dashboard (should redirect if not authenticated)
echo "- Dashboard"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/dashboard
# Expected: 200 or 302

# Pricing page
echo "- Pricing"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/pricing
# Expected: 200

# 404 page
echo "- 404 page"
curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/nonexistent
# Expected: 404
```

---

### Step 6.8: Test Frontend API Integration

**AI verifies frontend can communicate with backend:**

```bash
# Check if frontend has correct API URL
curl -s $FRONTEND_URL | grep -o "PROJECT_NAME-backend.onrender.com"
# Should find the backend URL

# Check if Stripe publishable key is present
curl -s $FRONTEND_URL | grep -o "pk_test_[a-zA-Z0-9]*"
# Should find Stripe key
```

---

### Step 6.9: Browser Testing Checklist

**AI provides browser testing instructions for user:**

```
Please test the following in your browser:

Homepage (https://PROJECT_NAME.pages.dev):
- [ ] Page loads successfully
- [ ] No console errors
- [ ] Links work
- [ ] Responsive design works on mobile

Registration:
- [ ] Navigate to /register
- [ ] Fill in email, password, name
- [ ] Submit form
- [ ] Receive welcome email
- [ ] Redirect to dashboard

Login:
- [ ] Navigate to /login
- [ ] Enter credentials
- [ ] Submit form
- [ ] Redirect to dashboard
- [ ] Token stored in localStorage

Dashboard:
- [ ] User info displayed correctly
- [ ] Navigation works
- [ ] Can access all features

Email Verification:
- [ ] Click link in email
- [ ] Redirect to success page
- [ ] Email marked as verified

Phone Verification (if enabled):
- [ ] Enter phone number
- [ ] Receive SMS with code
- [ ] Enter code
- [ ] Phone marked as verified

Stripe Checkout:
- [ ] Click upgrade/subscribe button
- [ ] Redirect to Stripe Checkout
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Complete checkout
- [ ] Redirect back to app
- [ ] Subscription shows as active

Telegram Bot:
- [ ] Find bot in Telegram
- [ ] Send /start
- [ ] Receive welcome message
- [ ] Link account
- [ ] Send support message
- [ ] Receive response

Logout:
- [ ] Click logout
- [ ] Token removed
- [ ] Redirect to homepage
```

---

## PERFORMANCE TESTING

### Step 6.10: Load Testing

**AI creates simple load test:**

```bash
#!/bin/bash
BACKEND_URL="https://PROJECT_NAME-backend.onrender.com"

echo "Running load test..."
echo "Testing health endpoint with 100 concurrent requests"

for i in {1..100}; do
  (curl -s -o /dev/null -w "%{http_code}\n" $BACKEND_URL/api/health/live) &
done

wait

echo "Load test complete"
```

**AI checks response times:**
```bash
curl -s -o /dev/null -w "Time: %{time_total}s\n" \
  https://PROJECT_NAME-backend.onrender.com/api/health/live
```

**Expected:** < 1 second for health endpoint

---

### Step 6.11: Database Performance Check

**AI checks query performance:**
```bash
psql "$DATABASE_URL" << 'EOF'
-- Enable timing
\timing on

-- Test index usage
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'admin@example.com';

-- Test join performance
EXPLAIN ANALYZE 
SELECT u.email, COUNT(tc.id) as ticket_count
FROM users u
LEFT JOIN telegram_conversations tc ON tc.user_id = u.id
GROUP BY u.id, u.email;

-- Test pagination
EXPLAIN ANALYZE
SELECT * FROM audit_log 
ORDER BY created_at DESC 
LIMIT 50 OFFSET 0;
EOF
```

**AI verifies indexes are being used (should see "Index Scan" not "Seq Scan")**

---

## CUSTOM DOMAIN SETUP (OPTIONAL)

### Step 6.12: Frontend Custom Domain

**AI asks user:**
```
Do you want to set up a custom domain for the frontend?
(yes/no)
```

**If yes:**

**AI asks:** "What domain do you want to use? (e.g., app.yourdomain.com)"

**AI instructs user:**
```
1. Go to Cloudflare Dashboard → Pages
2. Select PROJECT_NAME project
3. Click "Custom domains" tab
4. Click "Set up a custom domain"
5. Enter: app.yourdomain.com
6. Click "Activate domain"

Cloudflare will automatically:
- Add DNS records
- Issue SSL certificate
- Configure redirects

This takes 2-5 minutes.
```

**After domain is active:**

**AI updates backend CORS:**
```bash
render env set CORS_ORIGINS="https://app.yourdomain.com,https://PROJECT_NAME.pages.dev" --service PROJECT_NAME-backend
render env set FRONTEND_URL="https://app.yourdomain.com" --service PROJECT_NAME-backend
```

**AI updates Stripe webhook allowed origins (if needed)**

---

### Step 6.13: Backend Custom Domain

**AI asks:**
```
Do you want to set up a custom domain for the backend?
(yes/no)
```

**If yes:**

**AI asks:** "What domain do you want to use? (e.g., api.yourdomain.com)"

**AI instructs user:**
```
1. Go to Render Dashboard → Services
2. Select PROJECT_NAME-backend
3. Click "Settings" tab
4. Scroll to "Custom Domain"
5. Click "Add Custom Domain"
6. Enter: api.yourdomain.com
7. Click "Save"

Render will show DNS instructions:
Add CNAME record in Cloudflare:
  Type: CNAME
  Name: api.yourdomain.com
  Target: PROJECT_NAME-backend.onrender.com
```

**AI can add DNS record via Cloudflare API:**
```bash
# Get Zone ID
ZONE_ID=$(npx wrangler zones list | grep yourdomain.com | awk '{print $1}')

# Add CNAME record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "api.yourdomain.com",
    "content": "PROJECT_NAME-backend.onrender.com",
    "ttl": 1,
    "proxied": false
  }'
```

**Wait for SSL certificate (2-10 minutes)**

**After domain is active:**

**AI updates frontend environment variable:**
```bash
npx wrangler pages project set PROJECT_NAME \
  NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

**Rebuild and redeploy frontend:**
```bash
cd frontend
npm run build
npx wrangler pages deploy .next --project-name=PROJECT_NAME
```

---

## FINAL DEPLOYMENT CHECKLIST

### Step 6.14: Complete Verification Checklist

**AI creates final checklist:**

```
=== INFRASTRUCTURE ===
- [x] GitHub repository created and code pushed
- [x] Cloudflare account configured
- [x] Render.com account configured
- [x] All services deployed

=== DATABASE ===
- [x] PostgreSQL database created on Render
- [x] Schema migrated (10 tables)
- [x] Indexes created (30+ indexes)
- [x] Triggers configured
- [x] Admin user created
- [x] Database connection working

=== CLOUDFLARE ===
- [x] D1 database created and initialized
- [x] R2 bucket created
- [x] KV namespace created
- [x] All secrets configured
- [x] Frontend deployed to Pages
- [x] Frontend environment variables set

=== BACKEND (RENDER) ===
- [x] Backend service deployed
- [x] All environment variables set (10+ variables)
- [x] Health endpoints working
- [x] Auto-deploy enabled
- [x] Logs accessible

=== EMAIL (RESEND) ===
- [x] API key configured
- [x] Custom domain added (optional)
- [x] DNS records configured (if custom domain)
- [x] Test email sent successfully
- [x] Welcome email template working
- [x] Verification email template working
- [x] Password reset template working

=== PAYMENTS (STRIPE) ===
- [x] API keys configured (test mode)
- [x] Products created
- [x] Prices created
- [x] Webhook endpoint configured
- [x] Webhook secret set
- [x] Test checkout working
- [x] Subscriptions tracked in database

=== TELEGRAM BOT ===
- [x] Bot created via @BotFather
- [x] Bot token configured
- [x] Webhook set to backend
- [x] Bot commands configured
- [x] /start command working
- [x] Account linking working
- [x] Support tickets working
- [x] Messages stored in database

=== SMS (TWILIO) - Optional ===
- [ ] Credentials configured
- [ ] Test SMS sent
- [ ] Phone verification working
- [ ] Rate limiting active

=== TESTING ===
- [x] Health checks passing
- [x] Registration flow working
- [x] Login flow working
- [x] Email verification working
- [x] Phone verification working (if enabled)
- [x] Payment flow working
- [x] Telegram bot working
- [x] Admin panel accessible
- [x] Error handling working
- [x] Rate limiting working
- [x] Frontend loads successfully
- [x] API integration working
- [x] Mobile responsive working

=== SECURITY ===
- [x] HTTPS enabled (automatic)
- [x] JWT secret strong and unique
- [x] CORS configured correctly
- [x] Rate limiting enabled
- [x] Input sanitization working
- [x] SQL injection protection (prepared statements)
- [x] Password hashing (bcrypt)
- [x] Environment variables secured
- [x] No secrets in code

=== PERFORMANCE ===
- [x] Response times < 1s for health checks
- [x] Database indexes working
- [x] Load test passed (100 concurrent requests)
- [x] No memory leaks

=== DOMAINS (Optional) ===
- [ ] Custom frontend domain configured
- [ ] Custom backend domain configured
- [ ] DNS records updated
- [ ] SSL certificates issued
- [ ] Redirects working

=== DOCUMENTATION ===
- [x] README.md created
- [x] Environment variables documented
- [x] API endpoints documented
- [x] Deployment guide complete
```

---

### Step 6.15: Generate Deployment Summary

**AI creates deployment summary document:**

```markdown
# Deployment Summary - PROJECT_NAME

Deployed: 2025-01-09
Status: Production Ready ✅

## URLs

- **Frontend**: https://PROJECT_NAME.pages.dev
- **Backend**: https://PROJECT_NAME-backend.onrender.com
- **Admin Panel**: https://PROJECT_NAME.pages.dev/admin
- **Telegram Bot**: @project_support_bot

## Custom Domains (if configured)
- **Frontend**: https://app.yourdomain.com
- **Backend**: https://api.yourdomain.com

## Services

### Cloudflare
- Account: user@example.com
- D1 Database: PROJECT_NAME-db
- R2 Bucket: PROJECT_NAME-files
- KV Namespace: CACHE

### Render.com
- Account: user@example.com
- Service: PROJECT_NAME-backend
- Database: PROJECT_NAME-db (PostgreSQL 15)
- Region: Oregon

### Third-party Services
- Resend: Email delivery
- Stripe: Payment processing (Test mode)
- Telegram: @project_support_bot
- Twilio: SMS verification (if enabled)

## Credentials

All credentials are stored securely in:
- Render environment variables
- Cloudflare secrets
- Local .env file (not in git)

## Admin Access

- Email: admin@example.com
- Password: Admin123! (CHANGE THIS IMMEDIATELY)

## Test User

- Email: e2etest@example.com
- Password: Test1234!

## Database Statistics

- Tables: 10
- Indexes: 30+
- Users: 2 (admin + test user)
- Storage: < 100 MB

## Next Steps

1. ✅ Change admin password
2. ✅ Test all features in production
3. ⏭️ Set up monitoring (optional)
4. ⏭️ Configure custom domains (optional)
5. ⏭️ Switch Stripe to live mode when ready
6. ⏭️ Add more admin users if needed
7. ⏭️ Customize UI/UX styling
8. ⏭️ Add more features

## Support

- Documentation: README.md files in each directory
- Backend logs: `render logs PROJECT_NAME-backend`
- Frontend logs: Cloudflare Dashboard → Pages → PROJECT_NAME
- Database access: `render postgres connect PROJECT_NAME-db`

## Maintenance Commands

### Backend
```bash
# View logs
render logs PROJECT_NAME-backend --tail 100

# Restart service
render services restart PROJECT_NAME-backend

# Update environment variable
render env set KEY=value --service PROJECT_NAME-backend
```

### Frontend
```bash
# Redeploy
cd frontend && npm run build
npx wrangler pages deploy .next --project-name=PROJECT_NAME

# Update environment variable
npx wrangler pages project set PROJECT_NAME KEY=value
```

### Database
```bash
# Connect to database
render postgres connect PROJECT_NAME-db

# Backup database
render postgres backup PROJECT_NAME-db

# Run query
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users"
```

---

**Deployment completed successfully!**
All systems operational and tested.
Ready for production use.
```

**AI saves this summary to:**
```bash
cat > DEPLOYMENT_SUMMARY.md << 'EOF'
[content above]
EOF

git add DEPLOYMENT_SUMMARY.md
git commit -m "Add deployment summary"
git push origin main
```

---

# PART 7
## Troubleshooting, Monitoring, and Ongoing Maintenance

Version: 4.0
This is the final part

---

## COMMON ISSUES AND SOLUTIONS

### Issue 1: Backend Not Responding

**Symptoms:**
- `curl https://PROJECT_NAME-backend.onrender.com/api/health/live` returns error
- 502 Bad Gateway
- Connection timeout

**Diagnosis:**
```bash
# Check service status
render services list | grep PROJECT_NAME-backend

# View logs
render logs PROJECT_NAME-backend --tail 100

# Check if service is running
render services info PROJECT_NAME-backend
```

**Common causes:**
1. Service crashed due to error
2. Out of memory (free tier: 512MB)
3. Environment variable missing
4. Database connection failed

**Solutions:**

**If crashed:**
```bash
# Restart service
render services restart PROJECT_NAME-backend

# Wait 30 seconds
sleep 30

# Test health
curl https://PROJECT_NAME-backend.onrender.com/api/health/live
```

**If out of memory:**
```bash
# Check logs for memory errors
render logs PROJECT_NAME-backend | grep -i "memory"

# Solution: Optimize code or upgrade plan
# Free tier: 512MB
# Paid tier: 2GB+ available
```

**If environment variable missing:**
```bash
# List all variables
render env list --service PROJECT_NAME-backend

# Add missing variable
render env set VARIABLE_NAME="value" --service PROJECT_NAME-backend

# Restart
render services restart PROJECT_NAME-backend
```

**If database connection failed:**
```bash
# Test database
psql "$DATABASE_URL" -c "SELECT 1"

# Check DATABASE_URL is set
render env list --service PROJECT_NAME-backend | grep DATABASE_URL

# Restart database if needed (Render dashboard)
```

---

### Issue 2: Frontend Not Loading

**Symptoms:**
- `https://PROJECT_NAME.pages.dev` shows error
- White screen
- 404 errors

**Diagnosis:**
```bash
# Check deployment status
npx wrangler pages deployment list --project-name=PROJECT_NAME

# Check build logs
npx wrangler pages deployment tail --project-name=PROJECT_NAME
```

**Common causes:**
1. Build failed
2. Wrong build output directory
3. Missing environment variables
4. Code errors in frontend

**Solutions:**

**If build failed:**
```bash
# Build locally first
cd frontend
npm install
npm run build

# Check for errors in output
# Fix any errors in code

# Redeploy
npx wrangler pages deploy .next --project-name=PROJECT_NAME
```

**If wrong output directory:**
```bash
# Verify build output location
ls -la frontend/.next

# Deploy correct directory
npx wrangler pages deploy frontend/.next --project-name=PROJECT_NAME
```

**If missing environment variables:**
```bash
# Check variables
npx wrangler pages project list PROJECT_NAME

# Set missing variables
npx wrangler pages project set PROJECT_NAME NEXT_PUBLIC_API_URL="https://PROJECT_NAME-backend.onrender.com"
npx wrangler pages project set PROJECT_NAME NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redeploy
cd frontend && npm run build
npx wrangler pages deploy .next --project-name=PROJECT_NAME
```

---

### Issue 3: Database Connection Fails

**Symptoms:**
- Backend logs show "database connection error"
- `/api/health/ready` returns error
- Database queries fail

**Diagnosis:**
```bash
# Test direct connection
psql "$DATABASE_URL" -c "SELECT version()"

# Check database status
render databases info PROJECT_NAME-db

# Check connection string
render env list --service PROJECT_NAME-backend | grep DATABASE_URL
```

**Common causes:**
1. Database is down
2. Wrong connection string
3. SSL configuration issue
4. Connection limit reached

**Solutions:**

**If database is down:**
```bash
# Check status in Render dashboard
render databases info PROJECT_NAME-db

# Database should show "available"
# If not, contact Render support
```

**If wrong connection string:**
```bash
# Get correct connection string
CORRECT_URL=$(render databases info PROJECT_NAME-db --json | grep connectionString | cut -d'"' -f4)

# Update environment variable
render env set DATABASE_URL="$CORRECT_URL" --service PROJECT_NAME-backend

# Restart backend
render services restart PROJECT_NAME-backend
```

**If SSL issue:**
```bash
# Ensure DB_SSL is set to true
render env set DB_SSL="true" --service PROJECT_NAME-backend

# Verify in connection code:
# ssl: { rejectUnauthorized: false }
```

**If connection limit reached:**
```bash
# Check active connections
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'"

# Free tier limit: 20 connections
# Solution: Close connections properly in code
# Or upgrade database plan
```

---

### Issue 4: Emails Not Sending

**Symptoms:**
- Users don't receive emails
- Email test fails
- Resend API returns error

**Diagnosis:**
```bash
# Test Resend API
curl https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"

# Check backend logs
render logs PROJECT_NAME-backend | grep -i "email"

# Check Resend dashboard
# https://resend.com/logs
```

**Common causes:**
1. Wrong API key
2. Domain not verified
3. Email in spam
4. Rate limit reached

**Solutions:**

**If wrong API key:**
```bash
# Get correct key from Resend dashboard
# https://resend.com/api-keys

# Update in Render
render env set RESEND_API_KEY="re_correct_key" --service PROJECT_NAME-backend

# Update in Cloudflare
echo "re_correct_key" | npx wrangler secret put RESEND_API_KEY

# Restart backend
render services restart PROJECT_NAME-backend
```

**If domain not verified:**
```
1. Go to https://resend.com/domains
2. Check domain status
3. If "Unverified", click on domain
4. Add/verify DNS records in Cloudflare
5. Click "Verify DNS Records"
6. Wait 5-10 minutes
```

**If email in spam:**
```
1. Check spam folder
2. Add SPF, DKIM, DMARC records (if custom domain)
3. Use verified domain (not resend.dev)
4. Check content for spam triggers
```

**If rate limit:**
```
Free tier: 100 emails/day, 3000/month
Check usage: https://resend.com/overview
Solution: Upgrade plan or wait for limit reset
```

---

### Issue 5: Stripe Webhook Not Working

**Symptoms:**
- Payments complete but subscription not activated
- Webhook events not received
- Database not updated after payment

**Diagnosis:**
```bash
# Check webhook endpoint
curl -X POST https://PROJECT_NAME-backend.onrender.com/api/webhooks/stripe

# Check Stripe webhook logs
# https://dashboard.stripe.com/test/webhooks

# Check backend logs
render logs PROJECT_NAME-backend | grep -i "webhook"
```

**Common causes:**
1. Wrong webhook URL
2. Wrong signing secret
3. Webhook endpoint not handling events
4. Firewall blocking requests

**Solutions:**

**If wrong webhook URL:**
```
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook
3. Verify URL: https://PROJECT_NAME-backend.onrender.com/api/webhooks/stripe
4. If wrong, update it
```

**If wrong signing secret:**
```bash
# Get correct secret from Stripe
# Dashboard → Webhooks → Your webhook → Signing secret

# Update in Render
render env set STRIPE_WEBHOOK_SECRET="whsec_correct_secret" --service PROJECT_NAME-backend

# Update in Cloudflare
echo "whsec_correct_secret" | npx wrangler secret put STRIPE_WEBHOOK_SECRET

# Restart backend
render services restart PROJECT_NAME-backend
```

**Test webhook:**
```
1. Go to Stripe webhook dashboard
2. Click "Send test webhook"
3. Select: checkout.session.completed
4. Should see 200 OK response
5. Check backend logs for processing
```

---

### Issue 6: Telegram Bot Not Responding

**Symptoms:**
- Bot doesn't reply to messages
- Commands don't work
- Webhook errors

**Diagnosis:**
```bash
# Check bot status
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe

# Check webhook
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo

# Check backend logs
render logs PROJECT_NAME-backend | grep -i "telegram"
```

**Common causes:**
1. Wrong bot token
2. Webhook not set
3. Backend endpoint not working
4. Bot blocked or restricted

**Solutions:**

**If wrong bot token:**
```bash
# Get correct token from @BotFather
# /token command

# Update in Render
render env set TELEGRAM_BOT_TOKEN="correct_token" --service PROJECT_NAME-backend

# Update in Cloudflare
echo "correct_token" | npx wrangler secret put TELEGRAM_BOT_TOKEN

# Set webhook again
curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook \
  -d "url=https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram"
```

**If webhook not set:**
```bash
# Set webhook
curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://PROJECT_NAME-backend.onrender.com/api/webhooks/telegram"}'

# Verify
curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo
```

**Test bot:**
```
1. Open Telegram
2. Find your bot
3. Send /start
4. Should receive response
5. Check backend logs if no response
```

---

## MONITORING AND LOGS

### Monitoring Setup

**Backend monitoring:**
```bash
# Real-time logs
render logs PROJECT_NAME-backend --tail

# Last 100 lines
render logs PROJECT_NAME-backend --tail 100

# Save logs to file
render logs PROJECT_NAME-backend --tail 1000 > logs.txt

# Filter for errors
render logs PROJECT_NAME-backend | grep -i "error"
```

**Frontend monitoring:**
```bash
# Deployment logs
npx wrangler pages deployment list --project-name=PROJECT_NAME

# Tail logs
npx wrangler pages deployment tail --project-name=PROJECT_NAME
```

**Database monitoring:**
```bash
# Connection count
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pg_stat_activity"

# Database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()))"

# Table sizes
psql "$DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
"

# Slow queries
psql "$DATABASE_URL" -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10
"
```

---

### Health Check Script

**AI creates monitoring script:**

```bash
#!/bin/bash
# save as: monitor.sh

BACKEND_URL="https://PROJECT_NAME-backend.onrender.com"
FRONTEND_URL="https://PROJECT_NAME.pages.dev"

echo "=== Health Check $(date) ==="

# Backend
echo "Backend:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/health/live)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "  ✅ Healthy (HTTP $BACKEND_STATUS)"
else
  echo "  ❌ Unhealthy (HTTP $BACKEND_STATUS)"
  # Send alert (email, Telegram, etc.)
fi

# Database
echo "Database:"
DB_STATUS=$(curl -s $BACKEND_URL/api/health/ready | grep -o '"database":"connected"')
if [ -n "$DB_STATUS" ]; then
  echo "  ✅ Connected"
else
  echo "  ❌ Disconnected"
fi

# Frontend
echo "Frontend:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "  ✅ Accessible (HTTP $FRONTEND_STATUS)"
else
  echo "  ❌ Not accessible (HTTP $FRONTEND_STATUS)"
fi

# Response time
echo "Response times:"
BACKEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" $BACKEND_URL/api/health/live)
echo "  Backend: ${BACKEND_TIME}s"
FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" $FRONTEND_URL)
echo "  Frontend: ${FRONTEND_TIME}s"

echo ""
```

**Run every 5 minutes via cron:**
```bash
chmod +x monitor.sh

# Add to crontab
crontab -e

# Add line:
*/5 * * * * /path/to/monitor.sh >> /path/to/monitor.log 2>&1
```

---

## BACKUP AND RESTORE

### Database Backup

**Manual backup:**
```bash
# Using Render CLI
render postgres backup PROJECT_NAME-db

# Using pg_dump
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql
```

**Automated backup script:**
```bash
#!/bin/bash
# save as: backup.sh

BACKUP_DIR="$HOME/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="$DATABASE_URL"

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $TIMESTAMP"

# Backup database
pg_dump "$DB_URL" > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

**Automated via cron (daily at 2 AM):**
```bash
chmod +x backup.sh

crontab -e

# Add:
0 2 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
```

---

### Database Restore

**Restore from backup:**
```bash
# Decompress
gunzip backup_20250109_020000.sql.gz

# Restore
psql "$DATABASE_URL" < backup_20250109_020000.sql

# Or use Render CLI
render postgres restore PROJECT_NAME-db --backup-id=BACKUP_ID
```

**Restore specific table:**
```bash
# Extract specific table from backup
pg_restore -t table_name backup.sql > table_backup.sql

# Restore specific table
psql "$DATABASE_URL" < table_backup.sql
```

---

## UPDATES AND REDEPLOYMENT

### Backend Updates

**Deploy code changes:**
```bash
# Make changes to code
# Commit changes
git add .
git commit -m "Update: description"
git push origin main

# Render auto-deploys (if enabled)
# Or manual deploy:
render deploy --service PROJECT_NAME-backend

# Monitor deployment
render logs PROJECT_NAME-backend --tail
```

**Update dependencies:**
```bash
cd backend
npm update
npm audit fix

# Test locally
npm run dev

# Commit and push
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin main
```

---

### Frontend Updates

**Deploy code changes:**
```bash
cd frontend

# Make changes
# Test locally
npm run dev

# Build
npm run build

# Deploy
npx wrangler pages deploy .next --project-name=PROJECT_NAME

# Or commit and push (if auto-deploy enabled)
git add .
git commit -m "Update: description"
git push origin main
```

---

### Database Schema Updates

**Adding new table:**
```sql
-- Create migration file: migrations/002_add_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_table_name ON new_table(name);
```

**Run migration:**
```bash
# Test locally first
psql "$DATABASE_URL_LOCAL" -f migrations/002_add_new_table.sql

# Run on production
psql "$DATABASE_URL" -f migrations/002_add_new_table.sql

# Or via Render
render postgres query PROJECT_NAME-db --file migrations/002_add_new_table.sql
```

**Adding new column:**
```sql
-- migrations/003_add_user_column.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_new_field ON users(new_field);
```

**Always test migrations on backup first!**

---

## SECURITY MAINTENANCE

### Regular Security Tasks

**Weekly:**
- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Verify backup completed
- [ ] Check disk usage

**Monthly:**
- [ ] Update dependencies (npm update)
- [ ] Review and rotate API keys if needed
- [ ] Check SSL certificate expiry (auto-renewed)
- [ ] Audit user accounts
- [ ] Review database access logs

**Quarterly:**
- [ ] Change admin password
- [ ] Review all environment variables
- [ ] Audit third-party integrations
- [ ] Review rate limiting rules
- [ ] Check for unused services

---

### Security Audit Script

```bash
#!/bin/bash
# save as: security-audit.sh

echo "=== Security Audit $(date) ==="

# Check failed logins (last 24h)
echo "Failed login attempts (24h):"
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as failed_attempts
FROM audit_log
WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '24 hours'
"

# Check admin accounts
echo "Admin accounts:"
psql "$DATABASE_URL" -c "SELECT email, created_at FROM users WHERE role = 'admin'"

# Check environment variables set
echo "Environment variables:"
REQUIRED_VARS=(DATABASE_URL JWT_SECRET RESEND_API_KEY STRIPE_SECRET_KEY)
for var in "${REQUIRED_VARS[@]}"; do
  if render env list --service PROJECT_NAME-backend | grep -q "$var"; then
    echo "  ✅ $var"
  else
    echo "  ❌ $var MISSING"
  fi
done

# Check SSL
echo "SSL Certificate:"
echo | openssl s_client -servername PROJECT_NAME-backend.onrender.com \
  -connect PROJECT_NAME-backend.onrender.com:443 2>/dev/null | \
  openssl x509 -noout -dates

echo ""
```

---

## PERFORMANCE OPTIMIZATION

### Database Optimization

**Analyze queries:**
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;

-- Vacuum and analyze
VACUUM ANALYZE;
```

**Add indexes for slow queries:**
```sql
-- Example: If users.email lookups are slow
CREATE INDEX CONCURRENTLY idx_users_email_lookup ON users(email) WHERE is_active = true;

-- Example: If date range queries are slow
CREATE INDEX idx_audit_log_date_range ON audit_log(created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';
```

---

### Backend Optimization

**Enable caching:**
```javascript
// Add to backend
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

// Cache frequently accessed data
async function getCachedData(key, fetchFn, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

**Optimize queries:**
```javascript
// Bad: N+1 query problem
for (const user of users) {
  const posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
}

// Good: Join or batch query
const users = await db.query(`
  SELECT u.*, json_agg(p.*) as posts
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  GROUP BY u.id
`);
```

---

## SCALING GUIDE

### When to Upgrade

**Upgrade Render plan if:**
- Free tier services sleep (15 min inactivity)
- 512MB RAM not enough
- Need faster response times
- Need more database connections

**Paid plans:**
- Starter: $7/month - 512MB RAM, always on
- Standard: $25/month - 2GB RAM
- Pro: $85/month - 4GB RAM

**Upgrade database if:**
- Free tier 90-day retention not enough
- Need more storage (> 1GB)
- Need more connections (> 20)
- Need high availability

---

## FINAL CHECKLIST

### Post-Deployment Maintenance

**AI provides final checklist:**

```
=== IMMEDIATE (First 24 Hours) ===
- [ ] Monitor logs for errors
- [ ] Test all critical features
- [ ] Verify backups working
- [ ] Change default admin password
- [ ] Document any custom configurations

=== WEEKLY ===
- [ ] Review error logs
- [ ] Check disk usage
- [ ] Verify backups completed
- [ ] Test health endpoints
- [ ] Review failed login attempts

=== MONTHLY ===
- [ ] Update dependencies
- [ ] Run security audit
- [ ] Review database performance
- [ ] Check API usage/limits
- [ ] Test disaster recovery

=== QUARTERLY ===
- [ ] Rotate credentials
- [ ] Review and optimize code
- [ ] Audit user permissions
- [ ] Review third-party costs
- [ ] Plan upgrades if needed

=== AS NEEDED ===
- [ ] Scale resources
- [ ] Add new features
- [ ] Optimize performance
- [ ] Update documentation
```

---

## SUPPORT AND RESOURCES

### Official Documentation

**Render:**
- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: support@render.com

**Cloudflare:**
- Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com
- Status: https://www.cloudflarestatus.com

**Resend:**
- Docs: https://resend.com/docs
- Status: https://status.resend.com
- Support: support@resend.com

**Stripe:**
- Docs: https://stripe.com/docs
- Status: https://status.stripe.com
- Support: https://support.stripe.com

**Twilio:**
- Docs: https://www.twilio.com/docs
- Status: https://status.twilio.com
- Support: https://support.twilio.com

---

### Community Resources

**Forums:**
- Stack Overflow: Tag with service name
- Reddit: r/webdev, r/selfhosted
- Discord: Cloudflare, Render communities

**Learning:**
- Render tutorials: https://render.com/docs/tutorials
- Cloudflare Workers: https://developers.cloudflare.com/workers/tutorials
- Node.js best practices: https://github.com/goldbergyoni/nodebestpractices

---

## CONGRATULATIONS!

**Your project is now:**
- ✅ Fully deployed
- ✅ Production-ready
- ✅ Monitored
- ✅ Backed up
- ✅ Documented
- ✅ Secure

**You can now:**
1. Focus on UI/UX customization
2. Add new features
3. Grow your user base
4. Scale as needed

**All infrastructure, integrations, and connections are complete and tested.**

---

END OF DEPLOYMENT GUIDE

All 7 parts complete.
Total deployment time: 45-60 minutes
Your active time: 10-15 minutes
Everything else automated by AI.