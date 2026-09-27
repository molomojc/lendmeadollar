# 💸 LendMeADollar

> **"Can 1 million people give one dollar to a random internet experiment?"**  
> *A minimalist, viral micro-crowdfunding experiment built on Next.js, PayPal, and Supabase.*

---

## ⚡ The Core MVP

```text
                 LEND ME A DOLLAR
                        │
                        ▼
              "I need $1 from you."
                        │
                        ▼
                   $1 PayPal
                        │
                        ▼
                  Payment succeeds
                        │
                        ▼
                  Counter increases
                        │
                        ▼
              "You're supporter #37"
                        │
                        ▼
                 Share on X/Reddit
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000):
* Click **GIVE $1** to test payment capture, supporter increment, and victory screen.
* Access the private admin ledger at [http://localhost:3000/admin](http://localhost:3000/admin) (Default password: `admin123`).

---

## 📁 File Structure

```text
lendmeadollar/
├── app/
│   ├── layout.tsx              # Root Layout (dark, pure black)
│   ├── page.tsx                # Homepage Server Component
│   ├── success/page.tsx        # Victory screen with supporter # & share button
│   ├── admin/page.tsx          # Private ledger with real-time stats
│   └── api/
│       ├── stats/              # GET: Live counter stats and recent legends
│       ├── paypal/
│       │   ├── create-order/   # POST: Server-side PayPal order generation ($1)
│       │   ├── capture-order/  # POST: Server-side order capture & DB recording
│       │   └── webhook/        # POST: Webhook verification & idempotent sync
│       └── admin/              # GET: Ledger metrics & transaction table
├── components/
│   ├── Counter.tsx             # Stark $ counter & minimal progress bar
│   ├── PayPalSection.tsx       # $1 PayPal checkout & simulation mode
│   ├── ActivityFeed.tsx        # Compact recent legends ticker
│   ├── ShareButtons.tsx        # Monochrome Share on X & Copy Link
│   └── HomeClient.tsx          # Unified homepage client wrapper
├── lib/
│   ├── db.ts                   # Supabase client + local fallback
│   ├── paypal.ts               # PayPal REST API OAuth & capture service
│   └── rate-limit.ts           # In-memory API rate limiter
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL schema
└── types/
    └── index.ts                # TypeScript interfaces
```

---

## 📜 Legal Disclaimer

*Contributions are 100% voluntary social experiment gifts and NOT loans, investments, or securities.*
