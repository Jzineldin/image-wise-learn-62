import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Users, Sparkles, BookOpen, Target } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
              About Tale Forge
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              We're on a mission to democratize storytelling through the power of artificial intelligence
            </p>
          </div>

          <div className="glass-card-elevated p-12 mb-16">
            <h2 className="text-3xl font-heading font-semibold mb-6 text-center">Our Story</h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-6">
              Tale Forge was born from a simple belief: everyone has a story to tell, but not everyone has the tools to tell it. 
              We saw how technology could bridge that gap, making storytelling accessible to people of all ages and backgrounds.
            </p>
            <p className="text-text-secondary text-lg leading-relaxed">
              Our AI-powered platform empowers creators to craft personalized, interactive narratives that captivate audiences 
              and bring imagination to life. Whether you're a parent creating bedtime stories, an educator inspiring students, 
              or simply someone with a tale to tell, Tale Forge is here to help you share your vision with the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="glass-card-interactive p-8 text-center">
              <Target className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-4">Our Mission</h3>
              <p className="text-text-secondary">
                To make storytelling accessible to everyone through innovative AI technology
              </p>
            </div>

            <div className="glass-card-interactive p-8 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-4">Our Vision</h3>
              <p className="text-text-secondary">
                A world where every imagination can be transformed into engaging, interactive stories
              </p>
            </div>

            <div className="glass-card-interactive p-8 text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-4">Our Values</h3>
              <p className="text-text-secondary">
                Creativity, accessibility, innovation, and the power of human imagination
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;