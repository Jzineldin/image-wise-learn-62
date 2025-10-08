import { Link } from 'react-router-dom';
import taleForgeLogoImage from '@/assets/tale-forge-logo.webp';
import taleForgeLogoFallback from '@/assets/tale-forge-logo.png';

const Footer = () => {
  return (
    <footer role="contentinfo" aria-label="Site footer" className="glass-card border-t border-primary/10 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
            <picture>
              <source srcSet={taleForgeLogoImage} type="image/webp" />
              <img
                src={taleForgeLogoFallback}
                alt="Tale Forge Logo"
                className="w-8 h-8 object-contain"
                width="32"
                height="32"
                loading="lazy"
                decoding="async"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </picture>
              <span className="text-xl font-heading font-bold text-gradient">Tale Forge</span>
            </div>
            <p className="text-text-secondary">
              Creating magical stories with the power of AI.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Product</h3>
            <nav aria-label="Product links" className="space-y-2">
              <Link to="/create" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Create Story
              </Link>
              <Link to="/discover" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Discover
              </Link>
              <Link to="/pricing" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Pricing
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Company</h3>
            <nav aria-label="Company links" className="space-y-2">
              <Link to="/about" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                About
              </Link>
              <Link to="/contact" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Contact
              </Link>
              <Link to="/testimonials" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Testimonials
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Legal</h3>
            <nav aria-label="Legal links" className="space-y-2">
              <Link to="/privacy" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Privacy
              </Link>
              <Link to="/terms" className="block px-2 py-1 rounded-md text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                Terms
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="border-t border-primary/10 mt-8 pt-8 text-center">
          <p className="text-text-tertiary">
            © 2025 Tale Forge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;