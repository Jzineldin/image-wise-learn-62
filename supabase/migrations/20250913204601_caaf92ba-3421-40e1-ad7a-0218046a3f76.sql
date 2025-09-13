-- Create user_characters table for character library
CREATE TABLE public.user_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  character_type TEXT DEFAULT 'human',
  personality_traits TEXT[],
  backstory TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

-- Create policies for user_characters
CREATE POLICY "Users can view their own characters" 
ON public.user_characters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters" 
ON public.user_characters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
ON public.user_characters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" 
ON public.user_characters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_characters_updated_at
BEFORE UPDATE ON public.user_characters
FOR EACH ROW
EXECUTE FUNCTION public.update_user_characters_updated_at();

-- Insert default characters for new users
INSERT INTO public.user_characters (user_id, name, description, character_type, personality_traits, backstory, is_public) VALUES
-- Default characters that will be copied for new users
('00000000-0000-0000-0000-000000000000', 'Brave Knight', 'A courageous knight with shining armor and a noble heart', 'human', ARRAY['brave', 'loyal', 'determined'], 'Trained since childhood to protect the innocent', true),
('00000000-0000-0000-0000-000000000000', 'Wise Owl', 'An ancient owl with vast knowledge and mystical powers', 'animal', ARRAY['wise', 'patient', 'mysterious'], 'Guardian of ancient secrets in the enchanted forest', true),
('00000000-0000-0000-0000-000000000000', 'Curious Cat', 'A playful cat who loves exploring and getting into adventures', 'animal', ARRAY['curious', 'playful', 'clever'], 'Always finding hidden passages and secret treasures', true),
('00000000-0000-0000-0000-000000000000', 'Magical Unicorn', 'A beautiful unicorn with healing powers and rainbow magic', 'magical', ARRAY['gentle', 'healing', 'pure'], 'Last unicorn of the Crystal Valley', true),
('00000000-0000-0000-0000-000000000000', 'Friendly Dragon', 'A kind dragon who breathes colorful bubbles instead of fire', 'dragon', ARRAY['friendly', 'creative', 'protective'], 'Protector of the village and friend to all children', true),
('00000000-0000-0000-0000-000000000000', 'Space Explorer', 'A young astronaut discovering new planets and alien friends', 'human', ARRAY['adventurous', 'scientific', 'brave'], 'Dreams of exploring the galaxy and making first contact', true);