import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, TestTube, Loader2 } from "lucide-react";

export const EmailCampaignManager = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "beta" | "active" | "inactive">("all");
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const sendCampaign = async (isTest: boolean = false) => {
    if (!subject || !htmlContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in subject and content",
        variant: "destructive",
      });
      return;
    }

    if (isTest && !testEmail) {
      toast({
        title: "Missing Test Email",
        description: "Please provide a test email address",
        variant: "destructive",
      });
      return;
    }

    const setter = isTest ? setIsTesting : setIsSending;
    setter(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-campaign-email', {
        body: {
          subject,
          htmlContent,
          recipientType,
          testEmail: isTest ? testEmail : undefined,
        }
      });

      if (error) throw error;

      toast({
        title: isTest ? "Test Email Sent" : "Campaign Sent Successfully",
        description: isTest 
          ? `Test email sent to ${testEmail}`
          : `Campaign sent to ${data.sent} recipients`,
      });

      if (!isTest) {
        // Clear form after successful send
        setSubject("");
        setHtmlContent("");
        setRecipientType("all");
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      
      // Check for Resend domain verification error
      const errorMessage = error.message || '';
      if (errorMessage.includes('verify a domain') || errorMessage.includes('testing emails')) {
        toast({
          title: "Domain Verification Required",
          description: "You need to verify a domain in Resend to send to other email addresses. Visit resend.com/domains to verify your domain.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Send Failed",
          description: errorMessage || "Failed to send campaign email",
          variant: "destructive",
        });
      }
    } finally {
      setter(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Campaign Manager
          </CardTitle>
          <CardDescription>
            Send announcements and updates to your users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                <SelectTrigger id="recipients">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="beta">Beta Users Only</SelectItem>
                  <SelectItem value="active">Active Users (Last 30 Days)</SelectItem>
                  <SelectItem value="inactive">Inactive Users (30+ Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content (HTML)</Label>
              <Textarea
                id="content"
                placeholder="Enter HTML content for the email"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                You can use HTML tags for formatting
              </p>
            </div>
          </div>

          {/* Preview */}
          {htmlContent && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Test Email */}
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="testEmail"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                onClick={() => sendCampaign(true)}
                disabled={isTesting || !subject || !htmlContent || !testEmail}
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Without a verified domain, Resend only allows sending to your own verified email address.
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Verify a domain here
              </a>
            </p>
          </div>

          {/* Send Button */}
          <Button
            onClick={() => sendCampaign(false)}
            disabled={isSending || !subject || !htmlContent}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Campaign...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Campaign to {recipientType === "all" ? "All Users" : 
                  recipientType === "beta" ? "Beta Users" :
                  recipientType === "active" ? "Active Users" : "Inactive Users"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Email Template Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Template Examples</CardTitle>
          <CardDescription>Professional templates with Tale Forge branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("Exciting Updates at Tale Forge 🎉");
              setHtmlContent(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="https://tale-forge.app/favicon.ico" alt="Tale Forge Logo" style="width: 64px; height: 64px; margin-bottom: 16px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Tale Forge</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Exciting Updates! 🎉</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hi there!
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We've been working hard to make Tale Forge even better for you. Here's what's new:
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px; font-size: 18px;">✨ What's New</h3>
      <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Improved AI story generation with better narrative flow</li>
        <li>Enhanced image quality and character consistency</li>
        <li>New text-to-speech narration feature</li>
        <li>Animated scene generation for immersive storytelling</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://tale-forge.app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Start Creating Stories</a>
    </div>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
      Ready to create magical stories? Log in now and experience the improvements!
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 32px; margin-bottom: 8px;">
      Best regards,<br>
      <strong>Kevin from Tale Forge</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 8px 0;">&copy; 2025 Tale Forge. All rights reserved.</p>
    <p style="margin: 8px 0;">
      <a href="https://tale-forge.app" style="color: #667eea; text-decoration: none;">Visit Tale Forge</a>
    </p>
  </div>
</div>`);
            }}
          >
            Feature Announcement
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("Welcome to Tale Forge! 🎨");
              setHtmlContent(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="https://tale-forge.app/favicon.ico" alt="Tale Forge Logo" style="width: 64px; height: 64px; margin-bottom: 16px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Tale Forge!</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Thank you for joining our community of storytellers and parents creating magical moments for children!
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      With Tale Forge, you can create personalized, AI-powered stories with beautiful illustrations that bring imagination to life.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://tale-forge.app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Start Your First Story</a>
    </div>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 32px; margin-bottom: 8px;">
      Happy storytelling!<br>
      <strong>Kevin from Tale Forge</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 8px 0;">&copy; 2025 Tale Forge. All rights reserved.</p>
  </div>
</div>`);
            }}
          >
            Welcome Email
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("We Miss You on Tale Forge! 📖");
              setHtmlContent(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="https://tale-forge.app/favicon.ico" alt="Tale Forge Logo" style="width: 64px; height: 64px; margin-bottom: 16px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Come Back and Create! 📖</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hi there!
    </p>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We noticed you haven't created any stories recently. We'd love to see what amazing tales you'll bring to life next!
    </p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px; font-size: 18px;">✨ Recent Improvements</h3>
      <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Better AI story generation</li>
        <li>Improved character consistency</li>
        <li>Text-to-speech narration</li>
        <li>Animated scene videos</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://tale-forge.app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Create a Story Now</a>
    </div>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 32px; margin-bottom: 8px;">
      Happy storytelling!<br>
      <strong>Kevin from Tale Forge</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 8px 0;">&copy; 2025 Tale Forge. All rights reserved.</p>
  </div>
</div>`);
            }}
          >
            Re-engagement Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
