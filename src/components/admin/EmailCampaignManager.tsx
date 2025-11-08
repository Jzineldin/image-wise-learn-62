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
          <CardDescription>Quick start templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("New Features Available on Tale Forge!");
              setHtmlContent(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Exciting New Features! 🎉</h1>
  <p>Hi there,</p>
  <p>We're thrilled to announce some amazing new features on Tale Forge:</p>
  <ul>
    <li>Feature 1: Description here</li>
    <li>Feature 2: Description here</li>
    <li>Feature 3: Description here</li>
  </ul>
  <p>Start creating amazing stories today!</p>
  <a href="https://your-domain.com" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Start Creating</a>
  <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>The Tale Forge Team</p>
</div>`);
            }}
          >
            New Features Announcement
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setSubject("We Miss You on Tale Forge!");
              setHtmlContent(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Come Back and Create! 📖</h1>
  <p>Hi there,</p>
  <p>We noticed you haven't created any stories recently. We'd love to see what amazing tales you'll create next!</p>
  <p><strong>Here's what's new:</strong></p>
  <ul>
    <li>Improved story generation</li>
    <li>New character options</li>
    <li>Enhanced audio features</li>
  </ul>
  <a href="https://your-domain.com" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Create a Story</a>
  <p style="color: #666; font-size: 14px; margin-top: 30px;">Happy storytelling!<br>The Tale Forge Team</p>
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
