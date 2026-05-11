# Motorkompaniet — Booking System
## Setup Guide (Step by step)

---

## What you get
- `/public/boka.html`   — Booking form for customers
- `/public/admin.html`  — Admin panel (you log in to see all bookings)
- `/api/book.js`        — API: saves booking + sends emails
- `/api/bookings.js`    — API: admin reads/updates bookings
- `/sql/schema.sql`     — Database setup

---

## Step 1 — Create a Supabase account (free database)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **New Project** → name it `motorkompaniet`
3. Choose a **region** close to Sweden (Europe West)
4. Set a database password (save it!)
5. Wait ~2 minutes for the project to start

**Then set up the database:**
1. In Supabase → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `sql/schema.sql` from this folder
4. Copy the entire contents and paste into Supabase SQL Editor
5. Click **Run** → you should see "Success"

**Get your Supabase keys:**
1. Go to **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxxx.supabase.co`)
3. Copy the **service_role secret** key (NOT the anon key)

---

## Step 2 — Create a Resend account (free emails)

1. Go to **https://resend.com** → Sign up (free)
2. Click **Add Domain** → enter `motorkompaniet.net`
3. Add the DNS records Resend shows you to your domain settings
   (your domain is at the company managing motorkompaniet.net)
4. Once verified, go to **API Keys** → **Create API Key**
5. Copy the key (starts with `re_...`)

---

## Step 3 — Deploy to Vercel (free hosting)

1. Go to **https://vercel.com** → Sign up with GitHub (free)
2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```
3. Open a terminal in this folder and run:
   ```
   vercel login
   vercel
   ```
4. Follow the prompts. Say YES to everything.

---

## Step 4 — Add your secret keys to Vercel

In Vercel dashboard → your project → **Settings** → **Environment Variables**

Add these 4 variables:

| Variable Name           | Value                          |
|-------------------------|--------------------------------|
| `SUPABASE_URL`          | Your Supabase Project URL      |
| `SUPABASE_SERVICE_KEY`  | Your Supabase service_role key |
| `RESEND_API_KEY`        | Your Resend API key (re_...)   |
| `ADMIN_SECRET`          | Make up a strong password      |

After adding variables → click **Redeploy** in Vercel.

---

## Step 5 — Connect your domain motorkompaniet.net

1. In Vercel → your project → **Settings** → **Domains**
2. Add `motorkompaniet.net` and `www.motorkompaniet.net`
3. Vercel shows you DNS records to add
4. Log into wherever motorkompaniet.net is registered
5. Add the DNS records Vercel shows
6. Wait up to 24 hours (usually 30 minutes)

---

## How to use it

**Booking form** — customers go to:
```
https://www.motorkompaniet.net/boka
```

**Admin panel** — you go to:
```
https://www.motorkompaniet.net/admin
```
Log in with the `ADMIN_SECRET` password you created in Step 4.

---

## What happens when a customer books

1. Customer fills out the form and clicks "Skicka bokning"
2. Booking is saved to your Supabase database
3. Customer gets a confirmation email automatically
4. You get an email at motorkompaniet@live.se with all booking details
5. You log into `/admin` to confirm or cancel the booking

---

## Need help?

Contact your web developer or reach out to the person who built this system.
