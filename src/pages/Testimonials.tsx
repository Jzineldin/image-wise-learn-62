import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Heart, Users, BookOpen, Sparkles, Code, Coffee } from "lucide-react";
import { useState } from "react";

const Testimonials = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const creatorStory = {
    name: "Kevin El-Zarka",
    role: "Founder & Creator of Tale Forge",
    story: `I'm Kevin, and I created Tale Forge during Lovable Shipped S1, where I ended up 2nd place globally.

Before Shipped, I was just a clueless student, not knowing where I belonged. All I knew was that my imagination has always been driving me. I've got 8 nephews and an incredible interest for AI, and when I realized the AI world is moving forward for adults and leaving kids behind, I knew I had to do something.

So I created Tale Forge. What started as an idea to solve the complexity of manual interactive fiction branching became something much bigger - a platform that brings AI-powered storytelling to families and children.

The journey from clueless student to global runner-up taught me that sometimes the best solutions come from personal passion and real need. Every story created, every child's reaction, every parent's feedback drives me to keep evolving Tale Forge into the family-safe AI storytelling platform I always envisioned.`,
    stats: {
      testimonials: "35+",
      placement: "2nd",
      nephews: "8",
      voices: "12"
    }
  };

  const testimonials = [
    // Parents & Families
    {
      category: "parents",
      name: "Parent Feedback",
      role: "Parent & Product Evaluator", 
      content: "So exciting to evaluate your project - when are you taking this to Disney?! I love this because I'd want to create stories about our daily adventures with my future kids! UX feedback: maybe I'm looking for something more girly, but that doesn't matter - the core concept is beautiful. Next level: partner with parenting influencers for authentic testimonials. This product sells itself once parents see their kids' reactions!",
      rating: 5,
      date: "July 2025"
    },
    {
      category: "parents",
      name: "Anonymous Parent",
      role: "Family User",
      content: "I want to create stories about our daily adventures with my kids! The instant story creation is fun, and the onboarding feels smooth. For next steps, I'd add an easy way to edit character names everywhere, and maybe offer a family-friendly price point. Loving the direction so far!",
      rating: 5,
      date: "July 2025"
    },
    
    // Educators & Learning
    {
      category: "educators",
      name: "Educator Feedback",
      role: "Education Specialist",
      content: "You've clearly made a bold and thoughtful call to rebuild under pressure, and the transparency in documenting both strategy and user feedback is commendable. From the current design and feature set, it feels like you're targeting creative writers, educators, and possibly parents looking for immersive storytelling tools. One question I had: are you also considering younger users or classrooms as a core audience? If so, how are you addressing accessibility and content safety?",
      rating: 5,
      date: "July 2025"
    },
    {
      category: "educators",
      name: "Anonymous Review",
      role: "Educational Consultant",
      content: "Strengths: innovative AI-generated storytelling with dynamic audio and user choices. Strong technical foundation with systematic rebuild strategy. Areas for improvement: complex scope may be overambitious for timeline. User feedback suggests targeting specific audiences (educators, parents) and improving accessibility. Key suggestion: focus on core storytelling features first, then expand. Consider educational market as primary target.",
      rating: 5,
      date: "July 2025"
    },
    {
      category: "educators",
      name: "Anonymous Educator",
      role: "Teacher & Learning Specialist",
      content: "There's clearly a ton of thought and effort behind this—feature-rich, polished, and aimed at a well-defined audience. The video does a solid job of showing how it all fits together. It feels like you're close to something that could really click with parents and educators looking for creative learning tools. Looking forward to seeing how the onboarding and community features evolve.",
      rating: 5,
      date: "July 2025"
    },

    // Product & Technical
    {
      category: "product",
      name: "Anonymous User", 
      role: "User Experience Reviewer",
      content: "Really impressive turnaround, demo mode is a game changer! The onboarding feels smooth and the instant story creation is fun. For next steps, I'd add an easy way to edit character names everywhere, and maybe offer a family-friendly price point. Loving the direction so far!",
      rating: 5,
      date: "July 2025"
    },
    {
      category: "product",
      name: "Anonymous User",
      role: "Product Designer",
      content: "You've done a fantastic job this week! The UI cleanup and shift toward a more professional, product-focused look really helps position Tale-Forge for wider use, especially with educators and parents. The idea of a separate educational sub-page is very smart, and it's great that you're already thinking about accessibility and safety for younger users.",
      rating: 5,
      date: "July 2025"
    },
    {
      category: "product",
      name: "Krista",
      role: "Interactive Fiction Creator",
      content: "I wrote interactive fiction and I had to calculate and write all of the branches. What fun to have AI do some of this. All the interactive fiction apps out there are smut. I like your audience for kids, but honestly the fact that you have different genres is attractive to me. I was not sure who my target audience was until just a week ago, but then by all the feedback of 'add' I got and some own research I realized, the digital AI world is moving so fast, but it feels like the little ones are getting left behind. Your interactive fiction background sounds amazing! The manual branching must have been incredibly complex. That's exactly what I wanted to solve - let AI handle the infinite possibilities.",
      rating: 5,
      date: "July 2025"
    },
    
    // Design & UX
    {
      category: "design",
      name: "Anonymous User",
      role: "UX Evaluator",
      content: "Great app! Flows well and has a lot of features. I would agree with the previous message that the messaging is a bit lost. It would be worth thinking about who the target audience is - seems like you have got a mix of adults and kids.",
      rating: 4,
      date: "July 2025"
    },
    {
      category: "design",
      name: "Anonymous User",
      role: "UI Designer",
      content: "Great first steps. I particularly love the UI/UX as it looks tailored to your users. Also, the login page looks awesome, much better than standard ones!",
      rating: 5,
      date: "June 2025"
    },
    {
      category: "design",
      name: "Anonymous User",
      role: "Design Reviewer",
      content: "I really like the UI, super cool start. I wasn't sure whether the user will be able to create a story as a video, or is this more for children? It would be helpful to maybe clarify what you can do? Overall really cool idea!",
      rating: 4,
      date: "July 2025"
    },

    // Business & Growth
    {
      category: "business",
      name: "Anonymous User",
      role: "Business Strategist",
      content: "There are many similar ideas about building child stories with AI. I think the 'choose your own adventure' idea makes it different from others, but I would suggest analyzing other tools and see how you can differentiate from other similar tools. BTW, I liked the narration.",
      rating: 4,
      date: "June 2025"
    },
    {
      category: "business",
      name: "Anonymous User",
      role: "Product Strategist",
      content: "This app is awesome. I'd love to see you integrate it with video, either with Veo from Google or maybe Midjourney. But honestly, I think it's really good. I'm not sure how to monetize it. You could probably monetize it if, instead of making stories, it created content? I think people would definitely pay for that. But I think it's a great idea, the process is very clear and it's definitely something I'd use. Amazing job!",
      rating: 5,
      date: "July 2025"
    },

    // Community Support
    {
      category: "community",
      name: "Aaron Herzberg",
      role: "Community Member",
      content: "Love your project man keep going! You can do it! I wish I could see you in the top 10 in Sweden!",
      rating: 5,
      date: "Recent"
    },
    {
      category: "community",
      name: "Brenton Andersen",
      role: "Mentor",
      content: "Hey Kevin, that's fantastic to hear. No the amount doesn't concern me, could be $100 could be $100k. The point is you're getting someone on board who can help you grow. Don't stress about the numbers, you're doing well.",
      rating: 5,
      date: "Recent"
    },
    {
      category: "community",
      name: "OPAL F",
      role: "Fellow Builder",
      content: "I've been seeing this type of transformation happening for others. I was building for self and then once I remembered my TD (target demographic), the UI came together and the feedback was amazingly supportive. Loving this new era of alignment.",
      rating: 5,
      date: "Recent"
    },
    {
      category: "community",
      name: "Nataly C - Pinpal",
      role: "Community Member",
      content: "This is an amazing focus - and kudos to you for implementing the feedback! This is looking FANTASTIC!",
      rating: 5,
      date: "Recent"
    }
  ];

  const categories = [
    { id: "all", label: "All Stories", icon: Heart },
    { id: "parents", label: "Parents & Families", icon: Users },
    { id: "educators", label: "Educators", icon: BookOpen },
    { id: "product", label: "Product Feedback", icon: Sparkles },
    { id: "design", label: "Design & UX", icon: Code },
    { id: "business", label: "Business Insights", icon: Users },
    { id: "community", label: "Community Support", icon: Coffee }
  ];

  const filteredTestimonials = selectedCategory === "all" 
    ? testimonials 
    : testimonials.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <Navigation />
      
      <main className="py-8">
        {/* Header */}
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Our Story & Community
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
              Real testimonials from parents, educators, and creators who've helped shape Tale Forge into what it is today
            </p>
          </div>
        </section>

        {/* Creator Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto glass-card">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{creatorStory.name}</h2>
                  <p className="text-muted-foreground">{creatorStory.role}</p>
                </div>
                
                <div className="prose prose-lg max-w-none text-foreground">
                  {creatorStory.story.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-center text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <Separator className="my-8" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{creatorStory.stats.testimonials}</div>
                    <div className="text-sm text-muted-foreground">Testimonials</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{creatorStory.stats.placement}</div>
                    <div className="text-sm text-muted-foreground">Global Placement</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{creatorStory.stats.nephews}</div>
                    <div className="text-sm text-muted-foreground">Nephews Inspiring</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{creatorStory.stats.voices}</div>
                    <div className="text-sm text-muted-foreground">Kid-Friendly Voices</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestimonials.map((testimonial, index) => (
                <Card key={index} className="glass-card hover-scale h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {testimonial.date}
                      </Badge>
                    </div>
                    
                    <p className="text-foreground mb-4 italic flex-grow text-sm leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="mt-auto">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Create Your Own Tale?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of families and educators already creating magical stories with Tale Forge
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Start Creating Stories
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Explore Features
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonials;