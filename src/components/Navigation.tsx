import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';

interface NavigationProps {
  className?: string;
}

const Navigation = ({ className = "" }: NavigationProps) => {
  return (
    <nav className={`glass-card border-b border-primary/10 sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src={taleForgeLogoImage} 
              alt="Tale Forge Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              Discover
            </Link>
            <Link to="/about" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              About
            </Link>
            <Link to="/pricing" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/auth" className="hidden sm:block">
              <Button variant="outline" className="btn-secondary">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;