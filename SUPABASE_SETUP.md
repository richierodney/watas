# Supabase Setup Instructions

## 1. Get Your Supabase Credentials

1. Go to your Supabase project: https://app.supabase.com/project/rxraqxtfbhslmqwveruq
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

## 2. Create Environment File

Create a `.env.local` file in the `web` directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rxraqxtfbhslmqwveruq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `web/supabase/schema.sql`
4. Click **Run** to create the tables

## 4. Restart Dev Server

After setting up environment variables, restart your Next.js dev server:

```bash
cd web
npm run dev
```








