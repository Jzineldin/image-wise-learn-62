import { supabase } from '@/integrations/supabase/client';

export const addSampleFeaturedStories = async () => {
  const sampleData = {
    profile: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'storyteller@taleforge.com',
      full_name: 'Tale Forge Storyteller',
      display_name: 'Tale Forge Stories',
      bio: 'Creating magical stories for children around the world'
    },
    stories: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'The Magical Forest Adventure',
        description: 'Join Luna and her enchanted fox companion as they discover a hidden forest where trees whisper secrets and flowers grant wishes.',
        genre: 'fantasy',
        age_group: '7-9',
        cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
        content: `Luna had always felt different from other children in her village. While they played with wooden toys, she found herself drawn to the whispers of the wind and the songs of the birds. One crisp autumn morning, while gathering berries for her grandmother, Luna noticed a shimmering path she had never seen before.

As she followed the mysterious trail, Luna discovered that she wasn't alone. A beautiful silver fox with eyes like starlight appeared beside her. "Hello, Luna," the fox spoke in a voice like tinkling bells. "I've been hoping you would find us. My name is Shimmer, and I've been sent to guide you to the Heart of the Forest."

Together, Luna and Shimmer ventured deeper into the enchanted woods, where flowers turned to face them as they passed and trees bent their branches to offer sweet fruits. At the center of the forest, they found a clearing filled with the most beautiful garden Luna had ever seen, where every wish spoken with a pure heart would bloom into reality.`
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: "Captain Stella's Space Rescue",
        description: 'When mysterious signals from distant planets reach Earth, brave astronaut Captain Stella embarks on an intergalactic mission to help alien friends.',
        genre: 'adventure',
        age_group: '7-9',
        cover_image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop',
        content: `Captain Stella adjusted her gleaming space helmet and gazed out at the vast expanse of stars through the window of her spacecraft, the Cosmic Dolphin. The mysterious radio signals from the Andromeda sector had been growing stronger each day, filled with what sounded like calls for help.

"Computer, set course for the Andromeda signals," she commanded. The ship's AI, Nova, responded immediately. "Course plotted, Captain. I've prepared the universal translator and emergency supplies." As they traveled through space, Stella practiced the intergalactic friendship gestures her grandmother had taught her.

When they finally reached the source of the signals, Stella discovered a beautiful crystal planet where gentle, musical creatures called Harmonians had lost their ability to sing. Without their songs, their world was slowly losing its magical glow. With kindness and determination, Stella helped them rediscover their voices, and their planet bloomed with color once again.`
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'The Mystery of Rainbow Lake',
        description: 'Detective Oliver and his clever dog Watson investigate why all the colors have disappeared from their favorite swimming spot.',
        genre: 'mystery',
        age_group: '7-9',
        cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        content: `Detective Oliver pushed his magnifying glass up his nose and studied the peculiar scene before him. Rainbow Lake, once the most beautiful and colorful spot in Willowbrook, had turned completely gray overnight. The lake that used to shimmer with all the colors of the rainbow now reflected only the cloudy sky above.

"This is definitely our most puzzling case yet, Watson," Oliver said to his faithful golden retriever companion, who wore a tiny detective hat. Watson barked twice – their special code for "I agree completely" – and began sniffing around the lake's edge for clues.

Following mysterious glittery footprints, Oliver and Watson discovered that a traveling artist had accidentally captured all the lake's colors in his magical paintbrush. Through kindness and understanding, Oliver helped the artist learn that true beauty was meant to be shared, not hoarded, and together they restored the lake's magnificent colors.`
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Super Sam Saves the Day',
        description: "When the town's electricity goes out during the big festival, young Sam discovers he has the power to bring light and joy back to everyone.",
        genre: 'superhero',
        age_group: '7-9',
        cover_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        content: `Sam Martinez had always been an ordinary kid who loved comic books and dreamed of having superpowers. But when a massive storm knocked out all the power in Maplewood right before the annual Harvest Festival, Sam discovered that sometimes the greatest superpower of all is the willingness to help others.

As darkness fell over the town, Sam noticed something strange happening. Wherever he walked with confidence and determination to help, a warm, gentle glow seemed to follow him. At first, he thought it was just his imagination, but when he held hands with scared little children to comfort them, the glow grew brighter.

"Mom, Dad, I think I can help everyone!" Sam called as he ran from house to house, sharing his mysterious light with neighbors who needed it most. By the end of the night, Sam realized that his superpower wasn't magic at all – it was his caring heart and brave spirit that had inspired the whole community to work together and save their celebration.`
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'Mia and the Talking Animals',
        description: 'When Mia discovers she can understand animal language, she becomes the bridge between the human and animal worlds to solve their shared problems.',
        genre: 'animal stories',
        age_group: '7-9',
        cover_image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop',
        content: `Mia was walking through the park when she heard a squirrel chattering angrily at a pigeon. To her amazement, she could understand every word! "That's MY acorn!" squeaked the squirrel. "I found it fair and square!" cooed the pigeon back. Mia couldn't believe her ears – she could understand animal language!

Word spread quickly through the animal kingdom that a human child could finally hear their voices. Soon, Mia found herself mediating disputes between cats and dogs, helping lost pets find their way home, and even organizing a peace treaty between the neighborhood raccoons and garbage collectors.

But Mia's greatest challenge came when the city planned to cut down the old oak tree in the park. With her unique gift, Mia brought together humans and animals to show everyone how important the tree was to both communities. Through understanding and cooperation, they found a way to save the tree and create a beautiful shared space for all.`
      }
    ]
  };

  try {
    console.log('Adding sample featured stories...');
    
    // Create sample profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: sampleData.profile.id,
        email: sampleData.profile.email,
        full_name: sampleData.profile.full_name,
        display_name: sampleData.profile.display_name,
        bio: sampleData.profile.bio,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (profileError) {
      console.error('Error creating sample profile:', profileError);
      return false;
    }

    // Create sample stories
    for (const story of sampleData.stories) {
      const { error: storyError } = await supabase
        .from('stories')
        .upsert({
          id: story.id,
          title: story.title,
          description: story.description,
          genre: story.genre,
          age_group: story.age_group,
          status: 'completed',
          visibility: 'public',
          user_id: sampleData.profile.id,
          author_id: sampleData.profile.id,
          language_code: 'en',
          cover_image: story.cover_image,
          credits_used: 2,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (storyError) {
        console.error(`Error creating story ${story.title}:`, storyError);
        continue;
      }

      // Create story segment
      const { error: segmentError } = await supabase
        .from('story_segments')
        .upsert({
          story_id: story.id,
          segment_number: 1,
          content: story.content,
          segment_text: story.content,
          is_ending: true,
          is_end: true,
          image_url: story.cover_image
        });

      if (segmentError) {
        console.error(`Error creating segment for ${story.title}:`, segmentError);
        continue;
      }

      // Feature the story
      const { error: featureError } = await supabase
        .from('featured_stories')
        .upsert({
          story_id: story.id,
          featured_by: sampleData.profile.id,
          priority: 5 - sampleData.stories.indexOf(story),
          is_active: true,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          reason: `Featured ${story.genre} story for young readers`
        });

      if (featureError) {
        console.error(`Error featuring story ${story.title}:`, featureError);
      }
    }

    console.log('Sample featured stories added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample featured stories:', error);
    return false;
  }
};