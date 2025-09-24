import { Link } from 'react-router-dom';
import taleForgeLogoImage from '@/assets/tale-forge-logo.webp';
import taleForgeLogoFallback from '@/assets/tale-forge-logo.png';

const Footer = () => {
  return (
    <footer className="glass-card border-t border-primary/10 py-12 mt-20">
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
            <div className="space-y-2">
              <Link to="/create" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Create Story
              </Link>
              <Link to="/discover" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Discover
              </Link>
              <Link to="/pricing" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Pricing
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Company</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-text-secondary hover:text-primary transition-colors story-link">
                About
              </Link>
              <Link to="/contact" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Contact
              </Link>
              <Link to="/blog" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Blog
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-text-primary">Legal</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Privacy
              </Link>
              <Link to="/terms" className="block text-text-secondary hover:text-primary transition-colors story-link">
                Terms
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary/10 mt-8 pt-8 text-center">
          <p className="text-text-tertiary">
            © 2024 Tale Forge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;