import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Users, ArrowRight, Play } from 'lucide-react';
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

      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            
            {/* Left Side - Main Content */}
            <div className="space-y-8">
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-heading font-bold text-fire-gradient leading-tight glow-fire">
                TALE<br />FORGE
              </h1>
              
              <p className="text-xl md:text-2xl text-text-secondary max-w-lg text-with-outline">
                Where every story becomes an adventure
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <Link to="/create">
                  <Button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                    Start Creating Magic
                  </Button>
                </Link>
                <Link to="/discover">
                  <Button variant="outline" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                    Explore Stories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Discovery Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="glass-card-dark p-8 max-w-md w-full rounded-2xl">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold text-white">
                    DISCOVER AMAZING STORIES
                  </h3>
                  
                  <p className="text-white/80 leading-relaxed">
                    Start your magical journey by creating your own personalized story
                  </p>
                  
                  <Link to="/create">
                    <Button className="btn-accent w-full text-lg py-3">
                      Create Your First Story
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
