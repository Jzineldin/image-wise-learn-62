import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Users, Star, ArrowRight, Play, Heart } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import heroBookImage from '@/assets/hero-book.jpg';
import childrenStoriesImage from '@/assets/children-stories.jpg';
import aiStorytellingImage from '@/assets/ai-storytelling.jpg';

const Index = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "AI-Powered Stories",
      description: "Create unique, personalized stories with advanced AI that adapts to your preferences and age group"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: "Interactive Adventures",
      description: "Experience branching narratives where your choices shape the story and determine multiple endings"
    },
    {
      icon: <Play className="w-8 h-8 text-primary" />,
      title: "Voice Narration",
      description: "Listen to beautifully narrated stories with AI-generated voices that bring characters to life"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Character Creation",
      description: "Design unique characters with personalities, traits, and backstories to star in your tales"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Parent",
      content: "My kids absolutely love Tale Forge! The stories are engaging and age-appropriate. It's become our favorite bedtime activity.",
      rating: 5
    },
    {
      name: "Teacher Alex",
      role: "Educator", 
      content: "An incredible tool for inspiring creativity in my students. The AI generates stories that captivate young minds.",
      rating: 5
    },
    {
      name: "Emma K.",
      role: "Young Writer",
      content: "Tale Forge helped me discover my love for storytelling. I've created over 20 stories and shared them with friends!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section - Simplified & Prominent */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-bold mb-8 text-gradient leading-tight">
                TALE FORGE
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto">
                Where imagination meets AI to create magical stories that come to life
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-md mx-auto">
                <Link to="/create">
                  <Button className="btn-primary text-lg px-10 py-4 glow-amber hover-scale w-full sm:w-auto">
                    Start Creating Magic
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/discover">
                  <Button variant="outline" className="btn-secondary text-lg px-10 py-4 w-full sm:w-auto">
                    Explore Stories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Featured Story Card - Right Side */}
            <div className="flex justify-center lg:justify-end">
              <div className="glass-card-elevated p-8 max-w-md glow-strong hover-scale animate-float">
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <img 
                      src={heroBookImage} 
                      alt="Featured story preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-primary">
                  A YOUNG WIZARD FINDS A MAP LEADING TO A...
                </h3>
                <div className="flex gap-3">
                  <Link to="/story/preview">
                    <Button variant="outline" className="btn-secondary text-sm px-4 py-2">
                      Read Story
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="btn-primary text-sm px-4 py-2">
                      Create Your Own
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
