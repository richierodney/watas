# Vercel Deployment Workarounds

## Problem
Git author `richierodney5@gmail.com` doesn't have access to team `kuwguap's` projects on Vercel.

## Workarounds

### Option 1: Deploy as Personal Project (Recommended)
Deploy to your personal Vercel account instead of the team:

```powershell
cd web
vercel --scope your-personal-email@example.com
```

Or unlink and redeploy:
```powershell
cd web
Remove-Item .vercel -Recurse -Force -ErrorAction SilentlyContinue
vercel
# When prompted, select your personal account instead of the team
```

### Option 2: Deploy via Vercel Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository OR drag and drop the `web` folder
4. Configure environment variables in the dashboard
5. Deploy

### Option 3: Add Email to Team
1. Go to https://vercel.com/teams/kuwguap/settings/members
2. Add `richierodney5@gmail.com` as a team member
3. Then deploy normally: `vercel`

### Option 4: Use Different Git Author (Temporary)
Change git config for this deployment:

```powershell
cd web
git config user.email "your-vercel-email@example.com"
vercel
git config user.email "richierodney5@gmail.com"  # Restore original
```

### Option 5: Deploy Without Linking
Deploy without linking to a project:

```powershell
cd web
vercel --yes --no-verify
```

### Option 6: Use Vercel CLI with Token
1. Get a Vercel token from: https://vercel.com/account/tokens
2. Deploy with token:
```powershell
cd web
vercel --token YOUR_TOKEN
```

## Recommended: Dashboard Deployment
For the easiest experience, use the Vercel Dashboard:
1. Build the project: `cd web && npm run build`
2. Go to vercel.com and create a new project
3. Upload or connect your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!








