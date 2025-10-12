import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, BookOpen, Users, ArrowRight, Play, Star, CheckCircle, Zap, TrendingUp, Globe, Crown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FeaturedStoriesCarousel from '@/components/FeaturedStoriesCarousel';
import FloatingFeedbackButton from '@/components/FloatingFeedbackButton';
import { addSampleFeaturedStories } from '@/lib/helpers/sample-data';
import { OptimizedImage, HeroImage, CardImage } from '@/components/ui/optimized-image';
import heroBookImage from '@/assets/hero-book.jpg';
import childrenStoriesImage from '@/assets/children-stories.jpg';
import aiStorytellingImage from '@/assets/ai-storytelling.jpg';
import { useEffect, useState } from 'react';
import { useLiveStats } from '@/hooks/useLiveStats';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [sampleDataAdded, setSampleDataAdded] = useState(false);
  const { stats, isLoading } = useLiveStats();
  const { profile, isAuthenticated } = useAuth();

  // Add sample featured stories on first visit (development aid)
  useEffect(() => {
    const initializeSampleData = async () => {
      if (!sampleDataAdded && process.env.NODE_ENV === 'development') {
        const success = await addSampleFeaturedStories();
        if (success) {
          setSampleDataAdded(true);
        }
      }
    };
    initializeSampleData();
  }, [sampleDataAdded]);

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
      name: "Parent Feedback",
      role: "Parent & Product Evaluator",
      content: "This product sells itself once parents see their kids' reactions! I love this because I'd want to create stories about our daily adventures with my future kids. The core concept is beautiful.",
      rating: 5
    },
    {
      name: "Anonymous User",
      role: "User Experience Reviewer", 
      content: "Demo mode is a game changer! The onboarding feels smooth and the instant story creation is fun. Loving the direction so far!",
      rating: 5
    },
    {
      name: "Krista",
      role: "Interactive Fiction Creator",
      content: "I wrote interactive fiction and had to calculate all of the branches. What fun to have AI do some of this! Your interactive fiction background sounds amazing!",
      rating: 5
    },
    {
      name: "Anonymous Educator",
      role: "Education Specialist",
      content: "There's clearly a ton of thought and effort behind this—feature-rich, polished, and aimed at a well-defined audience. Could really click with parents and educators looking for creative learning tools.",
      rating: 5
    },
    {
      name: "Anonymous User",
      role: "Product Reviewer",
      content: "The UI cleanup and shift toward a more professional, product-focused look really helps position Tale-Forge for wider use, especially with educators and parents.",
      rating: 5
    },
    {
      name: "Anonymous User",
      role: "Parent & Designer",
      content: "Great app! Flows well and has a lot of features. The 'choose your own adventure' idea makes it different from others. I think people would definitely pay for that!",
      rating: 5
    }
  ];

  const displayStats = [
    { number: stats.totalStories > 0 ? `${stats.totalStories}+` : "153+", label: "Stories Created", icon: <BookOpen className="w-5 h-5" /> },
    { number: "2", label: "Languages", icon: <Globe className="w-5 h-5" /> },
    { number: "🇸🇪 🇬🇧", label: "Swedish & English", icon: <Sparkles className="w-5 h-5" /> },
    { number: "100%", label: "5-Star Rated", icon: <Star className="w-5 h-5" /> }
  ];

  // Check if user has founder status
  const hasFounderStatus = profile && (profile.is_beta_user || profile.founder_status === 'founder');

  const howItWorks = [
    { step: "1", title: "Choose Your Adventure", description: "Select characters, themes, and age-appropriate settings" },
    { step: "2", title: "Create Magic", description: "Our AI crafts a unique, personalized story just for you" },
    { step: "3", title: "Share & Enjoy", description: "Read, listen, and share your magical tales with others" }
  ];

  const faqs = [
    {
      question: "Is Tale Forge safe for children?",
      answer: "Yes! All our AI-generated content is filtered for age-appropriateness and safety. We use advanced content moderation to ensure family-friendly stories."
    },
    {
      question: "How much does Tale Forge cost?",
      answer: "We offer a free plan with 10 credits per month (enough for 2-3 stories), and premium plans starting at $9.99/month for 100 credits (10-20 stories) with additional features."
    },
    {
      question: "Can I customize the stories?",
      answer: "Absolutely! You can create custom characters, choose story themes, set age groups, and even influence the story direction with interactive choices."
    },
    {
      question: "Are the stories unique?",
      answer: "Every story generated by Tale Forge is completely unique, powered by advanced AI that creates original narratives based on your specific inputs and preferences."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Floating Feedback Button */}
      <FloatingFeedbackButton />

      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto -mt-16">
            
            {/* Left Side - Main Content */}
            <div className="space-y-8 lg:space-y-10 flex flex-col justify-center min-h-[500px]">
              {/* Beta Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 w-fit">
                <Crown className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  BETA LAUNCH - Get Founder Status + 100 Free Credits!
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-heading font-bold text-fire-gradient leading-[0.9] glow-fire">
                  TALE<br />FORGE
                </h1>

                <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-lg text-with-outline leading-relaxed">
                  Where every story becomes an adventure
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                {hasFounderStatus ? (
                  <Link to="/create">
                    <Button variant="default" size="lg" className="w-full sm:w-auto shadow-xl hover:shadow-2xl gap-2">
                      <BookOpen className="w-5 h-5" />
                      Create Story
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="lg" className="w-full sm:w-auto shadow-xl hover:shadow-2xl gap-2">
                      <Crown className="w-5 h-5" />
                      Claim Founder Status
                    </Button>
                  </Link>
                )}
                <Link to="/discover">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl">
                    Explore Stories
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>
                    <strong className="text-foreground">
                      {isLoading ? '...' : stats.founderCount}
                    </strong> founding members
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span><strong className="text-foreground">5.0★</strong> from 35+ reviews</span>
                </div>
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

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
              Magical Features
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto text-with-shadow">
              Discover the power of AI storytelling with features designed to inspire and delight
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card hover-lift group">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-text-secondary text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-8 border-primary/30">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {displayStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2 text-primary">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-text-primary mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto text-with-shadow">
              Creating magical stories is as easy as 1, 2, 3
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white shadow-glow">
                    {step.step}
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="text-2xl font-heading font-semibold text-text-primary mb-4">
                  {step.title}
                </h3>
                <p className="text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
                What Our Users Say
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto text-with-shadow">
                Join thousands of storytellers who've discovered the magic
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
                {testimonials.slice(0, 6).map((testimonial, index) => (
                  <Card key={index} className="glass-card hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <CardTitle className="text-lg text-text-primary">{testimonial.name}</CardTitle>
                      <CardDescription className="text-primary text-sm">{testimonial.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 flex-grow">
                      <p className="text-text-secondary italic">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link to="/testimonials">
                  <Button variant="outline" size="lg" className="group">
                    Read All Stories & Meet the Creator
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      {/* Pricing Teaser Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-12 text-center border-primary/30">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
              Start Your Story Today
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Start free with 10 credits or unlock unlimited creativity with premium
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-text-primary">Free Plan</div>
                <div className="text-text-secondary">10 credits/month</div>
                <div className="text-xs text-muted-foreground mt-1">~2-3 stories</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-primary/30"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">Starter</div>
                <div className="text-text-secondary">$9.99/month</div>
                <div className="text-xs text-muted-foreground mt-1">100 credits (~10-20 stories)</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button variant="default" size="lg">
                  Try Free Now
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-text-secondary mt-4">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              No credit card required for free plan
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto text-with-shadow">
              Everything you need to know about Tale Forge
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-xl text-text-primary">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-text-secondary">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-card-elevated p-12">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-fire-gradient mb-6">
              Ready to Create Magic?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of storytellers and start creating your unique tales today
            </p>
            <Link to="/create">
              <Button variant="default" size="lg" className="text-lg sm:text-xl px-6 sm:px-8 md:px-12 py-3 sm:py-4 shadow-xl hover:shadow-2xl">
                <Zap className="w-6 h-6 mr-2" />
                Start Creating Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
