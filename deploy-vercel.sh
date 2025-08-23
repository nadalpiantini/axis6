#!/bin/bash

echo "🚀 Iniciando deployment a Vercel..."

# Set environment variables for Vercel
export NEXT_PUBLIC_SUPABASE_URL="https://nvpnhqhjttgwfwvkgmpk.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDkyNTYsImV4cCI6MjA3MTI4NTI1Nn0.yVgnHzflgpX_CMY4VB62ndZlsrfeH0Mlhl026HT06C0"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM"
export NEXT_PUBLIC_APP_URL="https://axis6.app"

echo "✅ Variables de entorno configuradas"

# Deploy to Vercel
echo "📦 Desplegando a Vercel..."
vercel --prod \
  --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --env NODE_ENV="production" \
  --build-env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-env NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --yes

echo "✅ Deploy completado!"