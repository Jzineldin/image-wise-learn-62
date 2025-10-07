import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { EmailService } from '../_shared/email-service.ts';

serve(async (req) => {
  try {
    const emailService = new EmailService();
    const success = await emailService.sendEmail({
      to: 'jzineldin@gmail.com',
      subject: 'Tale Forge Email Test',
      text: 'This is a test email to verify the Resend integration is working correctly.',
    });

    if (success) {
      return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});