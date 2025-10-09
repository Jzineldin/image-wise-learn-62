import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { EmailService } from '../_shared/email-service.ts';
import { createAdminSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { dryRun = false } = await req.json();

    console.log('🚀 Starting migration email send...');
    console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);

    // Get all users
    const supabase = createAdminSupabaseClient();
    
    let allUsers = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });
      
      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
      
      if (data && data.users && data.users.length > 0) {
        allUsers = allUsers.concat(data.users);
        console.log(`Fetched page ${page}: ${data.users.length} users (total: ${allUsers.length})`);
        
        if (data.users.length < 1000) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Found ${allUsers.length} users`);

    // Categorize users
    const googleAuthUsers = [];
    const emailPasswordUsers = [];

    for (const user of allUsers) {
      const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                          user.app_metadata?.providers?.includes('google') ||
                          user.identities?.some(id => id.provider === 'google');
      
      if (isGoogleAuth) {
        googleAuthUsers.push(user);
      } else {
        emailPasswordUsers.push(user);
      }
    }

    console.log(`Email/Password users: ${emailPasswordUsers.length}`);
    console.log(`Google Auth users: ${googleAuthUsers.length}`);

    const results = {
      totalUsers: allUsers.length,
      emailPasswordUsers: emailPasswordUsers.length,
      googleAuthUsers: googleAuthUsers.length,
      emailsSent: 0,
      emailsFailed: 0,
      errors: []
    };

    if (dryRun) {
      console.log('⚠️ DRY RUN - No emails will be sent');
      return new Response(JSON.stringify({
        message: 'Dry run completed',
        results
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send emails using Resend
    const emailService = new EmailService();

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      const isGoogleAuth = googleAuthUsers.some(u => u.id === user.id);
      
      console.log(`📧 [${i + 1}/${allUsers.length}] Sending to: ${user.email}`);

      try {
        const subject = 'Tale Forge - Important: System Migration & Login Instructions';
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #333; text-align: center; margin-bottom: 20px;">Tale Forge System Migration</h1>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We're writing to let you know that <strong>Tale Forge has been migrated to a new and improved system</strong>.
              </p>

              <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h2 style="color: #333; font-size: 18px; margin-top: 0;">🔐 How to Log In:</h2>
                
                ${isGoogleAuth ? `
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                    <strong>Good news!</strong> Since you use Google to sign in:
                  </p>
                  <ol style="color: #666; font-size: 16px; line-height: 1.8;">
                    <li>Go to <a href="https://tale-forge.app" style="color: #007bff;">https://tale-forge.app</a></li>
                    <li>Click "Sign in with Google"</li>
                    <li>That's it! No password needed.</li>
                  </ol>
                ` : `
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                    You'll need to reset your password:
                  </p>
                  <ol style="color: #666; font-size: 16px; line-height: 1.8;">
                    <li>Go to <a href="https://tale-forge.app" style="color: #007bff;">https://tale-forge.app</a></li>
                    <li>Click "Forgot Password"</li>
                    <li>Enter your email and follow the reset link</li>
                    <li>Set a new password and log in</li>
                  </ol>
                `}
              </div>

              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; font-size: 16px; margin-top: 0;">💔 We Apologize</h3>
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  We know system migrations can be frustrating, and we're truly sorry for any inconvenience. 
                  This migration was necessary to improve Tale Forge's performance and reliability.
                </p>
              </div>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                <strong>Your account and data are safe.</strong> If you have any trouble logging in, just reply to this email and we'll help you immediately.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://tale-forge.app" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Tale Forge</a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Thank you for your patience and for being part of Tale Forge!
              </p>

              <br>
              <p style="color: #333; font-weight: bold;">
                Best regards,<br>
                Kevin<br>
                Tale Forge Team
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>&copy; 2025 Tale Forge. All rights reserved.</p>
            </div>
          </div>
        `;

        const success = await emailService.sendEmail({
          to: user.email,
          subject,
          html
        });

        if (success) {
          console.log(`   ✅ Email sent to ${user.email}`);
          results.emailsSent++;
        } else {
          console.log(`   ❌ Failed to send to ${user.email}`);
          results.emailsFailed++;
          results.errors.push({
            email: user.email,
            error: 'Failed to send email'
          });
        }

        // Small delay to avoid overwhelming Resend
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`   ❌ Error sending to ${user.email}:`, error);
        results.emailsFailed++;
        results.errors.push({
          email: user.email,
          error: error.message
        });
      }
    }

    console.log('✅ Migration email send complete!');
    console.log(`Emails sent: ${results.emailsSent}`);
    console.log(`Emails failed: ${results.emailsFailed}`);

    return new Response(JSON.stringify({
      message: 'Migration emails sent',
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending migration emails:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

