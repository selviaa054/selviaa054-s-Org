# ChikiSel — Supabase Setup & Deployment Guide (Tugas Akhir PKK)

This project is architected to work seamlessly with **Supabase** (PostgreSQL + Authentication + Row Level Security) and includes an Express development server fallback when environment keys are not yet configured.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose your organization, name it `chikisel-snacks`, set a strong database password, and select the nearest region (e.g., `Singapore`).
3. Wait ~1–2 minutes for provisioning to finish.

---

## 2. Create Tables, RLS Policies & Seed 12 Snack Products

1. In your Supabase Dashboard, open **SQL Editor** from the left sidebar.
2. Click **New Query**.
3. If your Supabase project is brand new, copy the contents of `supabase/schema.sql`. If your project already has older tables (`products`, `profiles`, `orders`) from earlier tests, copy the contents of `supabase/reset_and_setup.sql` instead so legacy policies and columns are cleanly replaced.
4. Paste it into the SQL Editor and click **Run**.

This creates:
- `public.profiles` — Linked to `auth.users(id)` with `role` (`'user'` or `'admin'`), shipping address, phone, city, and postal code. (Also backfills any existing `auth.users` rows into `public.profiles`.)
- `public.products` — Pre-seeded with **12 local snacks & drinks** across 4 categories (`Chiki & Puffs`, `Chips & Savory`, `Sweet Snacks`, `Drinks & Milk`).
- `public.orders` — Stores customer checkout details, payment method (`QRIS` or `COD`), order number, total amount, and order status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- `public.order_items` — Line items linking each order to its purchased products (`orders.id` & `products.id`).
- **Row Level Security (RLS)** policies using `SECURITY DEFINER` helpers (`is_admin()` & `current_user_role()`) so regular users can only read/create their own orders and edit their own profile without RLS recursion, while admins have full CRUD access over products, orders, and user roles.
- **Trigger `on_auth_user_created`** — Automatically creates a `profiles` row whenever a user registers.

> **Tip for faster testing:** In **Authentication → Providers → Email**, disable **Confirm email** so newly registered accounts sign in immediately without waiting for email verification.

---

## 3. Configure Environment Variables Safely

1. In your Supabase Dashboard, go to **Project Settings → API**.
2. Copy your **Project URL** and **anon public** key. (Never expose your `service_role` key in client code!)
3. Create a `.env` file in the root directory (or set Secrets in your hosting platform):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
```

4. Restart the server (`npm run dev`). The app automatically detects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `src/lib/supabase.ts` and switches all auth, catalog, checkout, and admin requests directly to your live Supabase database.

---

## 4. Create Your First Admin Account

For security, newly registered accounts default to `'user'`. To promote your account to `'admin'`:

1. Register an account in the ChikiSel app UI.
2. Open **Supabase Dashboard → SQL Editor** and run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

3. Refresh the app — the **Admin** navigation link and protected Admin Dashboard will now be unlocked for that account.

---

## 5. Folder Architecture Overview

```text
├── server.ts                  # Express + Vite server & local fallback store
├── supabase/
│   └── schema.sql             # PostgreSQL tables, triggers, RLS policies & seed data
├── src/
│   ├── lib/supabase.ts        # Supabase client initialization
│   ├── services/api.ts        # Unified data layer (Supabase + REST fallback)
│   ├── context/
│   │   ├── AuthContext.tsx    # Session & role-based auth state
│   │   └── CartContext.tsx    # Shopping bag state
│   ├── components/            # Modular UI views & protected Admin routes
│   └── types.ts               # Shared TypeScript data contracts
└── SUPABASE_SETUP.md          # Setup documentation
```
