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

## WATAs PRO (OpenAI + Paystack)

| Variable | Description |
|----------|-------------|
| **OPENAI_API_KEY** | Your OpenAI API key. Get from https://platform.openai.com/api-keys |
| **OPENAI_CHAT_MODEL** | (optional) Model, e.g. `gpt-4o` or `gpt-4o-mini`. Defaults to `gpt-4o`. |
| **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY** | Paystack public key (pk_test_... or pk_live_...). Used in the browser for checkout. |
| **PAYSTACK_SECRET_KEY** | Paystack secret key (sk_test_... or sk_live_...). Server-only; for verifying payments/webhooks. |
| **PAYSTACK_PRO_AMOUNT** | Amount to charge for PRO, in **smallest unit** (kobo for NGN, pesewas for GHS). Example: `5000` = 50.00. |

## Admin dashboard (users, PRO, API usage)

| Variable | Description |
|----------|-------------|
| **SUPABASE_SERVICE_ROLE_KEY** | From Supabase: Settings → API → `service_role` key. Lets the server list all profiles and update PRO. |
| **ADMIN_PASSWORD** | Password for `/admin` login. Also used to protect admin API routes (session cookie). |

## Verify:

After redeploying, your app should work without the Supabase error!








