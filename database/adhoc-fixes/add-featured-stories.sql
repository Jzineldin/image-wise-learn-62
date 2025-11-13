-- Create sample featured stories with realistic data

-- First create a sample profile for the storyteller
INSERT INTO profiles (
  id,
  email,
  full_name,
  display_name,
  bio,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'storyteller@taleforge.com',
  'Tale Forge Storyteller',
  'Tale Forge Stories',
  'Creating magical stories for children around the world',
  NOW() - INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Create sample user credits for the storyteller
INSERT INTO user_credits (
  user_id,
  current_balance,
  total_earned,
  total_spent,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  1000,
  1000,
  0,
  NOW() - INTERVAL '30 days'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert sample stories
INSERT INTO stories (
  id,
  title,
  description,
  genre,
  age_group,
  status,
  visibility,
  user_id,
  author_id,
  language_code,
  cover_image,
  credits_used,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'The Magical Forest Adventure',
  'Join Luna and her enchanted fox companion as they discover a hidden forest where trees whisper secrets and flowers grant wishes.',
  'fantasy',
  '7-9',
  'completed',
  'public',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'en',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
  2,
  NOW() - INTERVAL '7 days'
),
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Captain Stella''s Space Rescue',
  'When mysterious signals from distant planets reach Earth, brave astronaut Captain Stella embarks on an intergalactic mission to help alien friends.',
  'adventure',
  '7-9',
  'completed',
  'public',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'en',
  'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop',
  2,
  NOW() - INTERVAL '5 days'
),
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'The Mystery of Rainbow Lake',
  'Detective Oliver and his clever dog Watson investigate why all the colors have disappeared from their favorite swimming spot.',
  'mystery',
  '7-9',
  'completed',
  'public',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'en',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  2,
  NOW() - INTERVAL '3 days'
),
(
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'Super Sam Saves the Day',
  'When the town''s electricity goes out during the big festival, young Sam discovers he has the power to bring light and joy back to everyone.',
  'superhero',
  '7-9',
  'completed',
  'public',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'en',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  2,
  NOW() - INTERVAL '1 day'
),
(
  '550e8400-e29b-41d4-a716-446655440005'::uuid,
  'Mia and the Talking Animals',
  'When Mia discovers she can understand animal language, she becomes the bridge between the human and animal worlds to solve their shared problems.',
  'animal stories',
  '7-9',
  'completed',
  'public',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'en',
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop',
  2,
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- Create sample story segments for these stories
INSERT INTO story_segments (
  story_id,
  segment_number,
  content,
  segment_text,
  is_ending,
  is_end,
  image_url
) VALUES
-- The Magical Forest Adventure
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  1,
  'Luna had always felt different from other children in her village. While they played with wooden toys, she found herself drawn to the whispers of the wind and the songs of the birds. One crisp autumn morning, while gathering berries for her grandmother, Luna noticed a shimmering path she had never seen before.

As she followed the mysterious trail, Luna discovered that she wasn''t alone. A beautiful silver fox with eyes like starlight appeared beside her. "Hello, Luna," the fox spoke in a voice like tinkling bells. "I''ve been hoping you would find us. My name is Shimmer, and I''ve been sent to guide you to the Heart of the Forest."

Together, Luna and Shimmer ventured deeper into the enchanted woods, where flowers turned to face them as they passed and trees bent their branches to offer sweet fruits. At the center of the forest, they found a clearing filled with the most beautiful garden Luna had ever seen, where every wish spoken with a pure heart would bloom into reality.',
  'Luna had always felt different from other children in her village...',
  true,
  true,
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
),
-- Captain Stella's Space Rescue
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  1,
  'Captain Stella adjusted her gleaming space helmet and gazed out at the vast expanse of stars through the window of her spacecraft, the Cosmic Dolphin. The mysterious radio signals from the Andromeda sector had been growing stronger each day, filled with what sounded like calls for help.

"Computer, set course for the Andromeda signals," she commanded. The ship''s AI, Nova, responded immediately. "Course plotted, Captain. I''ve prepared the universal translator and emergency supplies." As they traveled through space, Stella practiced the intergalactic friendship gestures her grandmother had taught her.

When they finally reached the source of the signals, Stella discovered a beautiful crystal planet where gentle, musical creatures called Harmonians had lost their ability to sing. Without their songs, their world was slowly losing its magical glow. With kindness and determination, Stella helped them rediscover their voices, and their planet bloomed with color once again.',
  'Captain Stella adjusted her gleaming space helmet...',
  true,
  true,
  'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop'
),
-- The Mystery of Rainbow Lake
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  1,
  'Detective Oliver pushed his magnifying glass up his nose and studied the peculiar scene before him. Rainbow Lake, once the most beautiful and colorful spot in Willowbrook, had turned completely gray overnight. The lake that used to shimmer with all the colors of the rainbow now reflected only the cloudy sky above.

"This is definitely our most puzzling case yet, Watson," Oliver said to his faithful golden retriever companion, who wore a tiny detective hat. Watson barked twice – their special code for "I agree completely" – and began sniffing around the lake''s edge for clues.

Following mysterious glittery footprints, Oliver and Watson discovered that a traveling artist had accidentally captured all the lake''s colors in his magical paintbrush. Through kindness and understanding, Oliver helped the artist learn that true beauty was meant to be shared, not hoarded, and together they restored the lake''s magnificent colors.',
  'Detective Oliver pushed his magnifying glass up his nose...',
  true,
  true,
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
),
-- Super Sam Saves the Day
(
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  1,
  'Sam Martinez had always been an ordinary kid who loved comic books and dreamed of having superpowers. But when a massive storm knocked out all the power in Maplewood right before the annual Harvest Festival, Sam discovered that sometimes the greatest superpower of all is the willingness to help others.

As darkness fell over the town, Sam noticed something strange happening. Wherever he walked with confidence and determination to help, a warm, gentle glow seemed to follow him. At first, he thought it was just his imagination, but when he held hands with scared little children to comfort them, the glow grew brighter.

"Mom, Dad, I think I can help everyone!" Sam called as he ran from house to house, sharing his mysterious light with neighbors who needed it most. By the end of the night, Sam realized that his superpower wasn''t magic at all – it was his caring heart and brave spirit that had inspired the whole community to work together and save their celebration.',
  'Sam Martinez had always been an ordinary kid...',
  true,
  true,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
),
-- Mia and the Talking Animals
(
  '550e8400-e29b-41d4-a716-446655440005'::uuid,
  1,
  'Mia was walking through the park when she heard a squirrel chattering angrily at a pigeon. To her amazement, she could understand every word! "That''s MY acorn!" squeaked the squirrel. "I found it fair and square!" cooed the pigeon back. Mia couldn''t believe her ears – she could understand animal language!

Word spread quickly through the animal kingdom that a human child could finally hear their voices. Soon, Mia found herself mediating disputes between cats and dogs, helping lost pets find their way home, and even organizing a peace treaty between the neighborhood raccoons and garbage collectors.

But Mia''s greatest challenge came when the city planned to cut down the old oak tree in the park. With her unique gift, Mia brought together humans and animals to show everyone how important the tree was to both communities. Through understanding and cooperation, they found a way to save the tree and create a beautiful shared space for all.',
  'Mia was walking through the park when she heard a squirrel...',
  true,
  true,
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600&fit=crop'
)
ON CONFLICT (story_id, segment_number) DO NOTHING;

-- Now feature these stories
INSERT INTO featured_stories (
  story_id,
  featured_by,
  priority,
  is_active,
  featured_until,
  reason
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  5,
  true,
  NOW() + INTERVAL '30 days',
  'Magical adventure perfect for young readers'
),
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  4,
  true,
  NOW() + INTERVAL '30 days',
  'Space adventure that inspires courage and kindness'
),
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  3,
  true,
  NOW() + INTERVAL '30 days',
  'Mystery that teaches problem-solving and empathy'
),
(
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  2,
  true,
  NOW() + INTERVAL '30 days',
  'Superhero story about inner strength and community'
),
(
  '550e8400-e29b-41d4-a716-446655440005'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  1,
  true,
  NOW() + INTERVAL '30 days',
  'Animal adventure about communication and understanding'
)
ON CONFLICT (story_id) DO NOTHING;