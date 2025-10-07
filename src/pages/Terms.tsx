import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-text-secondary">
              Last updated: January 2025
            </p>
          </div>

          <div className="glass-card-elevated p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Acceptance of Terms</h2>
              <p className="text-text-secondary">
                By accessing and using Tale Forge, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Use License</h2>
              <p className="text-text-secondary mb-4">
                Permission is granted to temporarily use Tale Forge for personal, non-commercial 
                transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <p className="text-text-secondary">
                Under this license you may not:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mt-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">User Content</h2>
              <p className="text-text-secondary">
                You retain ownership of any intellectual property rights that you hold in content 
                you create using Tale Forge. However, by using our service, you grant us a license 
                to use, host, store, reproduce, and distribute your content solely for the purpose 
                of providing our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Disclaimer</h2>
              <p className="text-text-secondary">
                The materials on Tale Forge are provided on an 'as is' basis. Tale Forge makes no 
                warranties, expressed or implied, and hereby disclaims and negates all other warranties 
                including without limitation, implied warranties or conditions of merchantability, 
                fitness for a particular purpose, or non-infringement of intellectual property or 
                other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4">Contact Information</h2>
              <p className="text-text-secondary">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@taleforge.ai" className="text-primary hover:underline">
                  legal@taleforge.ai
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

export default Terms;