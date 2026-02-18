# Installation & Setup Guide - Groq Version

## ⚡ Fastest Setup (Automated)

```bash
cd agentic-learning-platform
chmod +x setup.sh
./setup.sh
```

This script will:
1. Check Node.js and PostgreSQL
2. Install all dependencies
3. Create .env file
4. Set up database schema
5. Seed sample data

Then just:
```bash
npm run dev
```

---

## 🔧 Manual Setup (Step-by-Step)

### Prerequisites Check

**1. Node.js 18+**
```bash
node --version  # Should be 18.0.0 or higher
npm --version
```

**2. PostgreSQL 14+**
```bash
psql --version  # Should be 14.0 or higher
```

**3. Groq API Key**
- Go to https://console.groq.com/
- Sign up or log in
- Navigate to API Keys
- Create a new API key
- Copy it (you'll need it in step 4)

---

### Step 1: Install Dependencies

```bash
cd agentic-learning-platform
npm install
```

This installs:
- Next.js 14
- Groq SDK
- Prisma (database ORM)
- React Flow (drag-and-drop)
- Mastra AI (agent orchestration)
- And all other dependencies

**Expected output:**
```
added 300+ packages in 30s
```

---

### Step 2: Create PostgreSQL Database

**Option A: Command Line**
```bash
createdb agentic_learning
```

**Option B: Using psql**
```bash
psql -U postgres
CREATE DATABASE agentic_learning;
\q
```

**Option C: Using pgAdmin or other GUI**
- Open your PostgreSQL GUI
- Create new database named `agentic_learning`

**Verify it exists:**
```bash
psql -l | grep agentic_learning
```

---

### Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
# or
vim .env
```

**Update these values in .env:**

```env
# Database connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/agentic_learning?schema=public"

# Groq API key from console.groq.com
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Example configurations:**

**Local PostgreSQL (default user):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/agentic_learning?schema=public"
```

**Docker PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/agentic_learning?schema=public"
```

**Supabase:**
```env
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Railway:**
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

---

### Step 4: Initialize Database

**Push the schema to your database:**
```bash
npm run db:push
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

🚀  Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

**What this does:**
- Creates 5 tables: Customer, Product, Transaction, TransactionItem, Alert
- Sets up relationships and indexes
- Generates Prisma Client for type-safe database access

---

### Step 5: Seed Sample Data

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Created 5 customers
✅ Created 8 products
✅ Created 30 transactions
✅ Created sample alerts
✨ Database seeded successfully!
```

**What gets created:**

**Customers (5):**
- Alice Johnson (New York)
- Bob Smith (Los Angeles)
- Carol White (Chicago)
- David Brown (Houston)
- Eve Davis (Phoenix)

**Products (8):**
- Laptop Pro 15 ($1,299.99)
- Wireless Mouse ($29.99)
- USB-C Cable ($15.99)
- Mechanical Keyboard ($149.99)
- 4K Monitor ($399.99)
- Laptop Stand ($49.99)
- Webcam HD ($79.99)
- Phone Case ($19.99)

**Transactions (30+):**
- 20 normal transactions
- 1 unusually high transaction ($15,000+)
- 5 failed transactions (same customer)
- 3 refunded transactions
- Mix of payment methods and statuses

**Alerts (2):**
- High-value transaction alert
- Multiple failed transactions alert

---

### Step 6: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.18
- Local:        http://localhost:3000
- Environments: .env

✓ Ready in 2.5s
```

---

### Step 7: Verify Everything Works

**Open your browser:**
```
http://localhost:3000
```

**Check database connection:**
- Look for green "Connected" indicator in top-left
- Should show counts: 5 customers, 8 products, 30+ transactions

**Test an agent:**
1. Drag "Data Agent" from palette to canvas
2. Click the agent node
3. In chat, type: "Show me all customers"
4. Agent should query database and return customer list

**If you see a response with customer data, everything is working! 🎉**

---

## 🧪 Verification Commands

**Test database connection:**
```bash
psql -U postgres -d agentic_learning -c "SELECT COUNT(*) FROM \"Customer\";"
```
Should return: `5`

**Test Groq API:**
```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```
Should return a JSON response with "Hello" reply.

**Check environment variables are loaded:**
```bash
cd agentic-learning-platform
node -e "require('dotenv').config(); console.log('DB:', !!process.env.DATABASE_URL); console.log('Groq:', !!process.env.GROQ_API_KEY);"
```
Should print: `DB: true` and `Groq: true`

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'groq-sdk'"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "Connection refused" (Database)

**Check PostgreSQL is running:**
```bash
# macOS
brew services list | grep postgresql

# Linux
systemctl status postgresql

# Windows
# Check Services panel for PostgreSQL service
```

**Start PostgreSQL if not running:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start from Services panel or pg_ctl
```

**Verify connection:**
```bash
psql -U postgres -c "SELECT version();"
```

---

### Issue: "Database does not exist"

**Solution:**
```bash
createdb agentic_learning

# Or create via psql
psql -U postgres -c "CREATE DATABASE agentic_learning;"
```

---

### Issue: "Invalid DATABASE_URL"

**Common mistakes:**
- Wrong port (default is 5432)
- Wrong password
- Missing `?schema=public` at the end
- Special characters not URL-encoded

**Test your connection string:**
```bash
psql "postgresql://username:password@localhost:5432/agentic_learning"
```

If psql connects, the URL is correct.

---

### Issue: "Groq API key invalid"

**Verify your key:**
1. Go to https://console.groq.com/
2. Check API Keys section
3. Make sure key is active
4. Copy the full key including `gsk_` prefix

**Test the key:**
```bash
export GROQ_API_KEY="your_key_here"
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

Should return list of available models.

---

### Issue: "Agent not responding"

**Check browser console:**
- Press F12
- Look for errors in Console tab
- Common issues:
  - Network error → Check API route
  - 401 Unauthorized → Check Groq API key
  - 500 Server error → Check server logs

**Check server logs:**
- Look at terminal where `npm run dev` is running
- Errors will show here

**Verify .env is loaded:**
```bash
# In your terminal running the server, restart with:
npm run dev
```
Environment variables are loaded at startup.

---

### Issue: "Port 3000 already in use"

**Solution 1: Stop the other process**
```bash
# Find process on port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

**Solution 2: Use different port**
```bash
PORT=3001 npm run dev
```

---

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

---

## 🔄 Reset Everything (Fresh Start)

```bash
# Remove node_modules
rm -rf node_modules package-lock.json

# Drop and recreate database
dropdb agentic_learning
createdb agentic_learning

# Reinstall
npm install

# Reinitialize
npm run db:push
npm run db:seed

# Start fresh
npm run dev
```

---

## 📊 Verify Installation Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Database `agentic_learning` created
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created with correct values
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Browser shows UI at http://localhost:3000
- [ ] Database connection shows green "Connected"
- [ ] Agent responds to test query

**If all checked, you're ready to learn! 🚀**

---

## 🎯 Next Steps

1. Read [QUICKSTART.md](QUICKSTART.md) for first workflows
2. Try [EXAMPLES.md](EXAMPLES.md) for advanced patterns
3. Explore [README.md](README.md) for full documentation
4. Experiment with editing agent prompts
5. Build your own custom workflows!

---

## 💬 Getting Help

**Can't get it working?**

1. Check all steps above carefully
2. Review error messages in terminal and browser console
3. Search the error message on Google/StackOverflow
4. Check Groq documentation: https://console.groq.com/docs
5. Check Mastra AI documentation: https://docs.mastra.ai/

**Common gotchas:**
- Forgot to create database
- Wrong credentials in .env
- PostgreSQL not running
- Port 3000 already in use
- API key not copied correctly
- Environment variables not loaded (restart server)
