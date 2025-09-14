import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Users, ArrowRight, Play } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FeaturedStoriesCarousel from '@/components/FeaturedStoriesCarousel';
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
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
            
            {/* Left Side - Main Content */}
            <div className="space-y-8 lg:space-y-10 flex flex-col justify-center min-h-[500px]">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-heading font-bold text-fire-gradient leading-[0.9] glow-fire">
                  TALE<br />FORGE
                </h1>
                
                <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-lg text-with-outline leading-relaxed">
                  Where every story becomes an adventure
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <Link to="/create">
                  <Button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto shadow-xl hover:shadow-2xl">
                    Start Creating Magic
                  </Button>
                </Link>
                <Link to="/discover">
                  <Button variant="outline" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto shadow-lg hover:shadow-xl">
                    Explore Stories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Featured Stories Carousel */}
            <div className="flex justify-center lg:justify-start xl:justify-center items-center min-h-[500px]">
              <div className="relative">
                {/* Connecting line/element for visual flow */}
                <div className="hidden lg:block absolute -left-8 top-1/2 transform -translate-y-1/2 w-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/60"></div>
                <FeaturedStoriesCarousel />
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
