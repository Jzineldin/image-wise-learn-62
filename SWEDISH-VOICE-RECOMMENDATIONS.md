# Swedish Voice Recommendations for Tale Forge

## Current Setup
We're using ElevenLabs' multilingual voices that support Swedish through the `eleven_multilingual_v2` model. These voices work well but aren't specifically Swedish-trained.

## How to Add Native Swedish Voices

### Option 1: Find Swedish Voices in Voice Library
1. Go to https://elevenlabs.io/voice-library
2. Use the language filter and select "Swedish"
3. Browse available Swedish voices
4. Add voices to your account
5. Copy the voice IDs

### Option 2: Clone Swedish Voices
1. Record a native Swedish speaker reading children's stories
2. Use ElevenLabs' Voice Cloning feature
3. This creates authentic Swedish voices perfect for storytelling

### Option 3: Community Voices
Search the Voice Library for community-created Swedish voices optimized for:
- Children's storytelling
- Educational content
- Swedish fairy tales

## Recommended Voice Characteristics for Children's Stories

For Swedish children's stories, look for voices with:
- **Warm and friendly tone** (like a parent reading bedtime stories)
- **Clear pronunciation** (important for language learning)
- **Expressive delivery** (to keep children engaged)
- **Age-appropriate** (not too formal or adult-sounding)

## Implementation Steps

1. **Test Current Voices**: The existing multilingual voices (Aria, Sarah, Charlotte for female; Roger, Liam for male) should work adequately with Swedish text.

2. **Evaluate Quality**: Generate sample Swedish story segments and evaluate:
   - Pronunciation accuracy
   - Natural intonation
   - Emotional expression

3. **Add Swedish-Specific Voices** (if needed):
   ```javascript
   // In your edge function, add Swedish-specific voice IDs when found:
   const voiceMapping = {
     sv: [
       // Add Swedish-specific voice IDs here once you find them
       { id: 'SWEDISH_VOICE_ID_1', name: 'Swedish Voice 1', description: 'Native Swedish storyteller' },
       { id: 'SWEDISH_VOICE_ID_2', name: 'Swedish Voice 2', description: 'Swedish children\'s narrator' },
       // Keep multilingual voices as fallback
       { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Ung, tydlig kvinnlig röst' },
       { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Mjuk kvinnlig berättarröst' },
     ]
   };
   ```

## Testing Swedish Pronunciation

Test these Swedish phrases to evaluate voice quality:

1. **Numbers and basics**: "En, två, tre, fyra, fem"
2. **Common story opener**: "Det var en gång..."
3. **Character names**: "Pippi Långstrump", "Emil i Lönneberga"
4. **Swedish-specific sounds**:
   - "sju" (seven) - tests the 'sj' sound
   - "kök" (kitchen) - tests the 'ö' sound
   - "går" (walks) - tests the 'å' sound

## Cultural Considerations

Swedish children's stories often reference:
- **Astrid Lindgren characters** (Pippi, Emil, Ronja)
- **Swedish folklore** (trolls, tomtar, älvor)
- **Nature elements** (forests, lakes, seasons)

Consider these when selecting voices that can convey the right atmosphere for Swedish storytelling.

## Next Steps

1. Test current multilingual voices with Swedish content
2. If quality isn't satisfactory, search Voice Library for Swedish voices
3. Consider professional voice cloning for premium experience
4. Update voice mappings in the edge function with new voice IDs