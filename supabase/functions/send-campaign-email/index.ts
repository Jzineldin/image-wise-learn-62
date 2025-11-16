import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignEmailRequest {
  subject: string;
  htmlContent: string;
  recipientType: 'all' | 'beta' | 'active' | 'inactive';
  testEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, htmlContent, recipientType, testEmail }: CampaignEmailRequest = await req.json();

    console.log('Campaign request:', { subject, recipientType, testEmail });

    // If test email, just send to one address
    if (testEmail) {
      const emailResponse = await resend.emails.send({
        from: "Kevin from Tale Forge <no-reply@tale-forge.app>",
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html: htmlContent,
      });

      console.log('Test email sent:', emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        sent: 1,
        testMode: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recipients based on type
    let query = supabase.from('profiles').select('email');

    if (recipientType === 'beta') {
      query = query.eq('is_beta_user', true);
    } else if (recipientType === 'active') {
      // Users who created stories in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsers } = await supabase
        .from('stories')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const activeUserIds = [...new Set(activeUsers?.map(s => s.user_id) || [])];
      query = query.in('id', activeUserIds);
    } else if (recipientType === 'inactive') {
      // Users who haven't created stories in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsers } = await supabase
        .from('stories')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const activeUserIds = activeUsers?.map(s => s.user_id) || [];
      if (activeUserIds.length > 0) {
        query = query.not('id', 'in', `(${activeUserIds.join(',')})`);
      }
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      throw recipientsError;
    }

    const emails = recipients
      ?.map(r => r.email)
      .filter((email): email is string => !!email) || [];

    console.log(`Sending to ${emails.length} recipients`);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        sent: 0,
        message: 'No recipients found for this criteria' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send in batches of 50 (Resend limit)
    const batchSize = 50;
    let sentCount = 0;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const emailResponse = await resend.emails.send({
        from: "Kevin from Tale Forge <no-reply@tale-forge.app>",
        to: batch,
        subject: subject,
        html: htmlContent,
      });

      console.log(`Batch ${Math.floor(i / batchSize) + 1} sent:`, emailResponse);
      sentCount += batch.length;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent: sentCount 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in send-campaign-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
