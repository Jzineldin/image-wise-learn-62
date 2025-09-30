#!/bin/bash

# Test Swedish story generation performance
# This script creates a story and generates content to trigger the Edge Function

SUPABASE_URL="https://hlrvpuqwurtdbjkramcp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzI5NzcsImV4cCI6MjA1MTE0ODk3N30.kKqGvJqQxJPqQQqQQqQqQqQqQqQqQqQqQqQqQqQqQqQ"
EMAIL="jzineldin@gmail.com"
PASSWORD="Rashzin1996!"

echo "🔐 Signing in..."
AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ]; then
  echo "❌ Authentication failed"
  echo $AUTH_RESPONSE
  exit 1
fi

echo "✅ Authenticated"

echo "📝 Creating story..."
STORY_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/stories" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Prefer: return=representation" \
  -d '{
    "age_group": "7-9",
    "genre": "fantasy",
    "language_code": "sv",
    "story_type": "short",
    "status": "draft"
  }')

STORY_ID=$(echo $STORY_RESPONSE | jq -r '.[0].id')

if [ "$STORY_ID" == "null" ]; then
  echo "❌ Story creation failed"
  echo $STORY_RESPONSE
  exit 1
fi

echo "✅ Created story: $STORY_ID"

echo "⏱️  Generating story (Swedish with Grok-4-Fast)..."
START_TIME=$(date +%s%3N)

GENERATE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/generate-story" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"storyId\": \"$STORY_ID\",
    \"ageGroup\": \"7-9\",
    \"genre\": \"fantasy\",
    \"languageCode\": \"sv\",
    \"prompt\": \"En magisk skog där träden kan prata\",
    \"characters\": []
  }")

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "✅ Story generated in ${DURATION}ms"
echo ""
echo "📊 Response:"
echo $GENERATE_RESPONSE | jq '.'

echo ""
echo "🔍 Now check Supabase logs for detailed timing breakdown:"
echo "   https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/logs/edge-functions"
echo "   Filter by function: generate-story"
echo "   Look for [PERF] and [PERF-AI] log entries"

