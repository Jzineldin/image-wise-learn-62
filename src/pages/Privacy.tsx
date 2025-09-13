import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-text-secondary">
              Last updated: January 2024
            </p>
          </div>

          <div className="glass-card-elevated p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Information We Collect</h2>
              <p className="text-text-secondary mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                generate stories, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Account information (name, email, username)</li>
                <li>Story content and preferences</li>
                <li>Usage analytics and performance data</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">How We Use Your Information</h2>
              <p className="text-text-secondary mb-4">
                We use the information we collect to provide, maintain, and improve our services.
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Generate personalized stories based on your preferences</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our AI models and storytelling capabilities</li>
                <li>Send important updates about our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Data Security</h2>
              <p className="text-text-secondary">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. All data is encrypted in 
                transit and at rest.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Contact Us</h2>
              <p className="text-text-secondary">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@taleforge.ai" className="text-primary hover:underline">
                  privacy@taleforge.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Privacy;