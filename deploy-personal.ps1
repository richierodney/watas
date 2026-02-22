# Deploy to Personal Vercel Account (Workaround)
# This script helps deploy without team restrictions

Write-Host "=== Vercel Personal Deployment Workaround ===" -ForegroundColor Cyan
Write-Host ""

# Option 1: Deploy with personal scope
Write-Host "Attempting to deploy to personal account..." -ForegroundColor Yellow
Write-Host "If this fails, use the Vercel Dashboard method instead." -ForegroundColor Yellow
Write-Host ""

# Try to deploy without team scope
$env:VERCEL_SCOPE = ""
vercel --yes --prod

Write-Host ""
Write-Host "=== Alternative: Use Vercel Dashboard ===" -ForegroundColor Cyan
Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor Yellow
Write-Host "2. Import your Git repository OR drag & drop the 'web' folder" -ForegroundColor Yellow
Write-Host "3. Add environment variables:" -ForegroundColor Yellow
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "4. Click Deploy!" -ForegroundColor Yellow








