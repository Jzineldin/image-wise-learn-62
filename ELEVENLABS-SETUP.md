# ElevenLabs TTS Setup Guide

## Environment Variable Setup

The edge function requires the `ELEVENLABS_API_KEY` environment variable to be set in your Supabase project.

### Step 1: Get Your ElevenLabs API Key

1. Go to https://elevenlabs.io/
2. Sign in or create an account
3. Navigate to your Profile Settings
4. Find your API key in the API section
5. Copy the API key

### Step 2: Set the Environment Variable in Supabase

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/settings/vault
2. Click on "Secrets" in the left sidebar
3. Click "New Secret"
4. Add the following:
   - Name: `ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key
   - Description: ElevenLabs API key for TTS generation
5. Click "Save"

#### Option B: Using Supabase CLI

```bash
supabase secrets set ELEVENLABS_API_KEY="your-api-key-here"
```

### Step 3: Verify the Edge Function

After setting the environment variable, the edge function should work properly.

## Troubleshooting

### Check if the API key is set:
```bash
supabase secrets list
```

### Common Issues:

1. **500 Internal Server Error**: Usually means the API key is not set or invalid
2. **403 Forbidden**: API key is valid but doesn't have sufficient permissions
3. **429 Too Many Requests**: You've hit your ElevenLabs rate limit

## Swedish Language Support

The system automatically detects the language based on your app settings:
- When Swedish is selected in settings, the TTS will use Swedish pronunciation
- When English is selected, it uses English pronunciation
- The same voices work for both languages thanks to ElevenLabs Multilingual v2 model

## Available Voices

Both English and Swedish support these voices:
- **Aria** (Female) - Young, clear voice
- **Sarah** (Female) - Gentle storyteller
- **Charlotte** (Female) - Calm narrator
- **Roger** (Male) - Warm narrator
- **Liam** (Male) - Friendly young voice

## Credit System

TTS generation costs are calculated as:
- 1 credit per 100 words (rounded up)
- Examples:
  - 1-100 words = 1 credit
  - 101-200 words = 2 credits
  - 250 words = 3 credits