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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
                Create <span className="text-gradient">Magical</span> Stories with AI
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl">
                Unleash your imagination with AI-powered storytelling. Create personalized, interactive tales 
                that adapt to any age group and bring characters to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/create">
                  <Button className="btn-primary text-lg px-8 py-4 glow-amber">
                    Start Creating
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/discover">
                  <Button variant="outline" className="btn-secondary text-lg px-8 py-4">
                    Explore Stories
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="glass-card-elevated p-8 glow-strong">
                <img 
                  src={heroBookImage} 
                  alt="Magical floating book with golden light"
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Why Choose <span className="text-gradient">Tale Forge</span>?
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Experience the future of storytelling with our cutting-edge AI technology 
              that creates unique, engaging narratives tailored to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card-interactive p-8 text-center group">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/30 transition-colors glow-amber">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-text-secondary group-hover:text-text-primary transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              How It <span className="text-gradient">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg glow-amber">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2">Choose Your Adventure</h3>
                  <p className="text-text-secondary">Select age group and genres that spark your imagination</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg glow-amber">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2">Create Characters</h3>
                  <p className="text-text-secondary">Design unique characters with personalities and backstories</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg glow-amber">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2">AI Generates Magic</h3>
                  <p className="text-text-secondary">Watch as our AI crafts your personalized story with images and narration</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg glow-amber">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-2">Share & Explore</h3>
                  <p className="text-text-secondary">Share your creations and discover amazing stories from others</p>
                </div>
              </div>
            </div>

            <div className="glass-card-elevated p-8">
              <img 
                src={aiStorytellingImage} 
                alt="AI brain creating magical stories"
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              What People Are <span className="text-gradient">Saying</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card-elevated p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-primary fill-current" />
                  ))}
                </div>
                <p className="text-text-secondary mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-text-primary">{testimonial.name}</p>
                  <p className="text-text-tertiary text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="glass-card-elevated p-12 max-w-4xl mx-auto glow-strong">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Ready to Create Your <span className="text-gradient">First Story</span>?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of storytellers and start crafting magical tales that will captivate and inspire.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button className="btn-primary text-lg px-8 py-4 glow-amber">
                  Start Free Trial
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" className="btn-secondary text-lg px-8 py-4">
                  Explore Stories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
