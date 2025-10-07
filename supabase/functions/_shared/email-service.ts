interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tale Forge <no-reply@tale-forge.app>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send email:', error);
        return false;
      }

      const result = await response.json();
      console.log('Email sent successfully:', result.id);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendPaymentConfirmationEmail(email: string, amount: number, credits: number): Promise<void> {
    const subject = 'Payment Confirmation - Tale Forge';
    const html = `
      <h1>Thank you for your purchase!</h1>
      <p>Your payment of $${amount} has been processed successfully.</p>
      <p>You have received ${credits} credits to your Tale Forge account.</p>
      <p>Start creating amazing stories today!</p>
      <br>
      <p>Best regards,<br>The Tale Forge Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendSubscriptionConfirmationEmail(email: string, plan: string): Promise<void> {
    const subject = 'Subscription Activated - Tale Forge';
    const html = `
      <h1>Welcome to ${plan}!</h1>
      <p>Your subscription has been activated successfully.</p>
      <p>You now have access to all premium features.</p>
      <br>
      <p>Best regards,<br>The Tale Forge Team</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    const subject = 'Welcome to Tale Forge!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to Tale Forge!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for signing up with Google OAuth. Your account has been created successfully and you're now part of the Tale Forge community!
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Start creating amazing personalized stories for children with our AI-powered platform. Choose from various genres, customize characters, and bring imagination to life.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tale-forge.app" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Creating Stories</a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you have any questions, feel free to reach out to our support team.
          </p>
          <br>
          <p style="color: #333; font-weight: bold; text-align: center;">
            Best regards,<br>The Tale Forge Team
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>&copy; 2025 Tale Forge. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}