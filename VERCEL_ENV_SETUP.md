# Setting Up Environment Variables on Vercel

## Error Fix
If you see: "Supabase URL or Anon Key not found" or "supabaseUrl is required"

## Steps to Fix:

1. **Go to your Vercel project dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `watas` project

2. **Navigate to Settings → Environment Variables**

3. **Add these two environment variables:**

   **Variable 1:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://rxraqxtfbhslmqwveruq.supabase.co`
   - **Environment:** Production, Preview, Development (select all)

   **Variable 2:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon key (get it from https://app.supabase.com/project/rxraqxtfbhslmqwveruq/settings/api)
   - **Environment:** Production, Preview, Development (select all)

4. **Redeploy**
   - After adding the variables, go to the "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger a new deployment

## Getting Your Supabase Anon Key:

1. Go to: https://app.supabase.com/project/rxraqxtfbhslmqwveruq
2. Click **Settings** (gear icon) → **API**
3. Copy the **anon/public** key under "Project API keys"
4. Paste it as the value for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Verify:

After redeploying, your app should work without the Supabase error!

