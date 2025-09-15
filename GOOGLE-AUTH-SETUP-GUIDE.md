# 📋 Google OAuth Integration Guide for Tale Forge

## Part 1: Google Developer Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: `Tale Forge 2025`
4. Click "Create"

### Step 2: Enable Google+ API
1. In your project, go to "APIs & Services" → "Enable APIs and Services"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - **App name**: Tale Forge
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **Application home page**: `https://your-app-domain.com`
   - **Authorized domains**: Add your domain (e.g., `your-app-domain.com`)
   - **Developer contact**: Your email

4. Add scopes:
   - `openid`
   - `email`
   - `profile`

5. Add test users if in development

### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: Tale Forge Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     http://localhost:5173
     https://your-app-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8080/auth/callback
     https://your-supabase-project.supabase.co/auth/v1/callback
     https://your-app-domain.com/auth/callback
     ```

5. Click "Create"
6. **SAVE THESE CREDENTIALS**:
   - Client ID: `your-client-id.apps.googleusercontent.com`
   - Client Secret: `your-client-secret`

---

## Part 2: Supabase Configuration

### Step 1: Enable Google Provider in Supabase
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" → "Providers"
4. Find "Google" and click "Enable"

### Step 2: Configure Google Provider
Add the following:
- **Client ID**: Paste your Google Client ID from above
- **Client Secret**: Paste your Google Client Secret from above
- **Authorized Client IDs** (optional): Add if using Google One Tap

### Step 3: Update Redirect URLs
In Supabase Authentication settings:
1. Go to "URL Configuration"
2. Add to "Redirect URLs":
   ```
   http://localhost:8080
   http://localhost:5173
   https://your-app-domain.com
   https://your-app-domain.com/dashboard
   ```

### Step 4: Database Configuration
No additional tables are needed! Supabase automatically handles:
- User creation in `auth.users` table
- Profile data in `raw_user_meta_data`
- Session management

However, you may want to create a trigger to sync with your `profiles` table:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Part 3: Environment Variables

Add these to your `.env.local` file:
```env
# These are already in your Supabase client
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: For enhanced security
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Part 4: Testing Checklist

### Local Development Testing
1. ✅ Google sign-in button appears on Auth page
2. ✅ Clicking button redirects to Google
3. ✅ Google account selection works
4. ✅ Redirect back to app after authentication
5. ✅ User profile data populated (name, email, avatar)
6. ✅ Session persists on refresh
7. ✅ Sign out works correctly

### Production Testing
1. ✅ Update Google OAuth redirect URIs with production domain
2. ✅ Update Supabase redirect URLs
3. ✅ Verify HTTPS is enforced
4. ✅ Test on multiple devices/browsers
5. ✅ Verify profile sync works

---

## Part 5: Troubleshooting

### Common Issues and Solutions

#### "Redirect URI mismatch" Error
- Ensure the redirect URI in Google Console matches EXACTLY with Supabase
- Check for trailing slashes
- Verify protocol (http vs https)

#### User profile not syncing
- Check if the trigger function is created
- Verify RLS policies are correct
- Check Supabase logs for errors

#### "Invalid client" Error
- Verify Client ID and Secret are correctly copied
- Check for extra spaces or line breaks
- Ensure Google+ API is enabled

#### Session not persisting
- Check localStorage is enabled
- Verify Supabase client configuration
- Check for CORS issues

---

## Part 6: Security Best Practices

1. **Never expose Client Secret** in frontend code
2. **Use HTTPS** in production
3. **Implement rate limiting** for auth endpoints
4. **Validate email domains** if restricting to organization
5. **Enable 2FA** for Google Workspace accounts
6. **Monitor authentication logs** in Supabase dashboard
7. **Implement session timeout** for sensitive applications

---

## Implementation Complete! 🎉

The Google OAuth integration has been added to your Auth component with:
- Beautiful Google sign-in button matching your theme
- Automatic profile syncing
- Seamless user experience
- Proper error handling
- Mobile-responsive design

Next steps:
1. Add your Google credentials to Supabase
2. Test the authentication flow
3. Customize the user profile page to display Google data