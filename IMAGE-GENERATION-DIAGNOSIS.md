# Image Generation Complete Diagnosis & Fix Plan

## 🔍 Root Cause Analysis

### What Happened
You're seeing **1,891 failed requests** to `generate-story-image` in the Network tab, all showing red X marks (failed to reach the server).

### Timeline of Changes
Based on git history, here's what led to this:

1. **Sept 16, 2025**: Switched from Freepik to OVH SDXL for image generation
2. **Sept 28, 2025**: Added "magical" and "surreal" styles, changed default from "natural" to "magical"
3. **Oct 1, 2025**: Major image generation upgrade - added 5 new art styles, changed default to `digital_storybook`
4. **Oct 14, 2025 (TODAY)**: Switched from Freepik to **Google Gemini 2.5 Flash Image** as primary provider (priority 0)

### The Actual Problem

**NOT a CORS issue** (I was wrong earlier). The real issues are:

#### 1. **Edge Function Not Deployed** ⚠️
- You have `GOOGLE_GEMINI_API_KEY` configured in Supabase (✅)
- But the Edge Function with Google Gemini integration may not be deployed
- The browser can't reach the function because it's either:
  - Not deployed at all
  - Deployed with old code (before Google Gemini integration)
  - Failing to start due to import errors

#### 2. **Circuit Breaker Tripped** 🔴
- After 3 consecutive `FunctionsFetchError` failures, the frontend circuit breaker opens
- Blocks all image generation for 60 seconds
- User sees: "Circuit breaker open for generate-story-image. Too many failures."

#### 3. **Excessive Retry Loop** 🔄
- The StoryViewer has a 30s polling mechanism
- The Create flow has a "fire-and-forget" image call
- When both fail, they keep retrying
- Result: 1,891 failed requests in ~15 minutes

## 📊 Current System State

### Image Provider Priority (as of Oct 14, 2025)
```typescript
Priority 0: GoogleGemini (gemini-2.5-flash-image) ← PRIMARY
Priority 1: OVH (stable-diffusion-xl-base-v10)
Priority 2: Replicate (SDXL)
Priority 3: HuggingFace (SDXL)
```

### Environment Variables (Confirmed ✅)
- `GOOGLE_GEMINI_API_KEY`: Configured
- `OVH_AI_ENDPOINTS_ACCESS_TOKEN`: Configured
- `REPLICATE_API_KEY`: Not visible (may not be configured)
- `HUGGINGFACE_API_KEY`: Not visible (may not be configured)

### Code State
- Frontend: Uses `AIClient` with circuit breaker (3 failures → 60s timeout)
- Backend: `generate-story-image` Edge Function with Google Gemini integration
- Image Service: Tries providers in priority order with fallback

## 🎯 Fix Plan

### Step 1: Deploy the Edge Function (CRITICAL)
```bash
# Navigate to project root
cd /home/ubuntu/image-wise-learn-62

# Deploy the generate-story-image function
supabase functions deploy generate-story-image --project-ref hlrvpuqwurtdbjkramcp --no-verify-jwt

# Verify deployment
supabase functions list --project-ref hlrvpuqwurtdbjkramcp
```

**Why this is critical**: The function code has Google Gemini integration, but if it's not deployed, the browser will get 404 or connection errors.

### Step 2: Verify Edge Function Logs
After deploying, check the Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/functions/generate-story-image/logs
2. Look for:
   - Function startup errors
   - Import errors (e.g., `google-gemini-image-service.ts` not found)
   - API key validation errors
   - Provider initialization errors

### Step 3: Test Image Generation
After deployment:
1. Hard refresh the app (Ctrl/Cmd+Shift+R)
2. Wait 60 seconds for circuit breaker to reset
3. Create a new story
4. Check Network tab for:
   - OPTIONS request to `/functions/v1/generate-story-image` → should return 200
   - POST request to `/functions/v1/generate-story-image` → should return 200 with JSON body

### Step 4: Monitor Provider Fallback
If Google Gemini fails, the system should automatically try:
1. OVH (you have the API key)
2. Replicate (may need API key)
3. HuggingFace (may need API key)

Check Edge Function logs for:
```
🎨 Attempting image generation with GoogleGemini...
❌ GoogleGemini failed: [error message]
🎨 Attempting image generation with OVH...
✅ OVH succeeded for image generation
```

## 🔧 Additional Fixes

### Fix 1: Reduce Circuit Breaker Sensitivity
The current circuit breaker trips after just 3 failures. For a new provider integration, this is too aggressive.

**File**: `src/lib/api/ai-client.ts`
**Change**: Increase `MAX_FAILURES` from 3 to 5 for `generate-story-image` only

### Fix 2: Add Manual Circuit Breaker Reset
Allow users to manually retry after circuit breaker trips.

**Implementation**: Add a "Retry Now" button that calls:
```typescript
AIClient.resetCircuit('generate-story-image');
```

### Fix 3: Improve Error Messages
Current error: "Service temporarily unavailable. Please try again in a moment."
Better error: "Image generation service is starting up. Please try again in 30 seconds."

## 🚨 Immediate Actions (Priority Order)

### 1. Deploy Edge Function (5 minutes)
```bash
supabase functions deploy generate-story-image --project-ref hlrvpuqwurtdbjkramcp --no-verify-jwt
```

### 2. Check Deployment Status (2 minutes)
- Supabase Dashboard → Functions → generate-story-image
- Look for "Deployed" status with recent timestamp

### 3. Test (3 minutes)
- Hard refresh app
- Wait 60 seconds
- Create new story
- Check if image generates

### 4. If Still Failing (10 minutes)
- Check Edge Function logs for errors
- Verify Google Gemini API key is valid
- Test with a simple curl command:
```bash
curl -X POST https://hlrvpuqwurtdbjkramcp.supabase.co/functions/v1/generate-story-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A magical forest", "style": "digital_storybook"}'
```

## 📝 Expected Outcomes

### Success Indicators
- ✅ Edge Function deploys without errors
- ✅ Network tab shows 200 responses for image generation
- ✅ Images appear in StoryViewer within 30 seconds
- ✅ No circuit breaker errors
- ✅ Edge Function logs show successful Google Gemini calls

### Failure Indicators
- ❌ Deployment fails with import errors
- ❌ Function logs show "Google Gemini service not initialized"
- ❌ Network tab still shows failed requests
- ❌ Circuit breaker still tripping

## 🔄 Rollback Plan (If Google Gemini Doesn't Work)

If Google Gemini integration is broken, temporarily revert to OVH as primary:

**File**: `supabase/functions/_shared/image-service.ts`
**Change**: Set OVH priority to 0, Google Gemini to 1

```typescript
google_gemini: {
  // ...
  priority: 1, // Changed from 0
  // ...
},
ovh: {
  // ...
  priority: 0, // Changed from 1
  // ...
}
```

Then redeploy:
```bash
supabase functions deploy generate-story-image --project-ref hlrvpuqwurtdbjkramcp --no-verify-jwt
```

## 📚 Related Documentation
- `GOOGLE-GEMINI-IMPLEMENTATION-SUMMARY.md` - Details of Google Gemini integration
- `IMAGE-GENERATION-UPGRADE-SUMMARY.md` - Recent style changes
- `FREEPIK-IMAGE-IMPLEMENTATION-SUMMARY.md` - Previous Freepik integration (now replaced)

## 🎯 Next Steps After Fix
1. Monitor image generation success rate for 24 hours
2. Collect user feedback on image quality
3. Consider adding Replicate/HuggingFace API keys for better fallback
4. Implement circuit breaker improvements
5. Add health check endpoint for image service

