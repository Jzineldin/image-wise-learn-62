// Translation constants for Swedish language support
export const TRANSLATIONS = {
  sv: {
    // UI Elements
    ui: {
      settings: 'Inställningar',
      profile: 'Profil',
      language: 'Språk',
      save: 'Spara',
      cancel: 'Avbryt',
      loading: 'Laddar...',
      saving: 'Sparar...',
      create: 'Skapa',
      next: 'Nästa',
      back: 'Tillbaka',
      finish: 'Slutför',
      generating: 'Genererar...',
      complete: 'Färdig',
      error: 'Fel',
      success: 'Framgång'
      , completeLabel: 'klart', step: 'Steg', of: 'av'
    },
    
    // Story Creation Flow
    storyCreation: {
      title: 'Skapa din berättelse',
      selectAge: 'Välj åldersgrupp',
      selectGenre: 'Välj genre',
      selectCharacters: 'Välj karaktärer',
      storyIdeas: 'Berättelseidéer',
      createStory: 'Skapa min berättelse',
      steps: {
        language: 'Språk',
        ageAndGenre: 'Ålder & Genre',
        characters: 'Karaktärer',
        storyIdeas: 'Berättelseidéer',
        review: 'Granska'
      },
      languageInstruction: 'Berättelser skapas på valt språk. Du kan översätta senare.'
    },

    // Age Groups
    ageGroups: {
      '4-6': {
        label: '4-6 År',
        description: 'Enkla berättelser med grundläggande ordförråd'
      },
      '7-9': {
        label: '7-9 År', 
        description: 'Äventyrsberättelser med viss komplexitet'
      },
      '10-12': {
        label: '10-12 År',
        description: 'Rika berättelser med djupare teman'
      },
      '13+': {
        label: '13+ År',
        description: 'Komplexa berättelser med mogna teman'
      }
    },

    // Genres
    genres: {
      'Fantasy': {
        name: 'Fantasy',
        description: 'Magiska världar, mytiska varelser och förtrollade äventyr'
      },
      'Adventure': {
        name: 'Äventyr',
        description: 'Spännande resor, utforskning och spännande utmaningar'
      },
      'Mystery': {
        name: 'Mysterium',
        description: 'Pussel att lösa, hemligheter att avslöja och ledtrådar att följa'
      },
      'Superhero Stories': {
        name: 'Superhjälteberättelser',
        description: 'Extraordinära krafter, hjältemodiga gärningar och att rädda dagen'
      },
      'Animal Stories': {
        name: 'Djurberättelser',
        description: 'Äventyr med djurvänner och naturutforskning'
      },
      'Fairy Tales': {
        name: 'Sagor',
        description: 'Klassiska berättelselement, moraliska lärdomar och tidlösa teman'
      }
    },

    // Character Creation
    characters: {
      title: 'Karaktärer',
      createNew: 'Skapa ny karaktär',
      name: 'Namn',
      description: 'Beskrivning',
      personality: 'Personlighet',
      backstory: 'Bakgrund',
      select: 'Välj karaktärer för din berättelse',
      noCharacters: 'Inga karaktärer skapade ännu',
      noCharactersDesc: 'Skapa din första karaktär för att komma igång med personliga berättelser',
      createFirst: 'Skapa din första karaktär',
      selected: 'Vald',
      count: '{selected}/{max}'
    },

    // Story Seeds
    storySeeds: {
      title: 'Berättelseidéer',
      subtitle: 'Välj en idé för att börja din berättelse',
      description: 'Vår AI har skapat personliga berättelseidéer baserat på din åldersgrupp, genrer och karaktärer. Välj en att börja med eller skriv en egen idé.',
      generating: 'Skapar berättelseidéer...',
      regenerate: 'Generera nya idéer',
      aiGenerated: 'AI-genererade idéer',
      customIdea: 'Anpassad berättelseidé',
      writeOwn: 'Skriv själv',
      useAiIdeas: 'Använd AI-idéer',
      yourStoryIdea: 'Din berättelseidé',
      customPlaceholder: 'Skriv din egen berättelseidé för {ageGroup} läsare i genren {genres}... Inkludera gärna {characters} i din berättelse!',
      customInstructions: 'Beskriv början på din berättelse och situationen som leder till val.',
      writeYourOwn: 'Skriv din egen berättelseidé',
      customPremise: 'Skapa en helt egen berättelsepremiss',
      storyCharacters: 'Berättelsekaraktärer',
      selected: 'Valda'
    },

    // Voice & Audio
    voice: {
      title: 'Röst & Ljud',
      selectVoice: 'Välj röst',
      enableAudio: 'Aktivera ljudberättelse',
      play: 'Spela',
      pause: 'Pausa',
      download: 'Ladda ner'
    },

    // Settings
    settings: {
      profileInfo: 'Profilinformation',
      notificationPrefs: 'Notifieringsinställningar',
      privacySecurity: 'Integritet & Säkerhet',
      accountSummary: 'Kontosammanfattning',
      preferredLanguage: 'Föredraget språk',
      fullName: 'Fullständigt namn',
      displayName: 'Visningsnamn',
      bio: 'Biografi',
      email: 'E-post',
      plan: 'Plan',
      credits: 'Krediter',
      storyUpdates: 'Berättelse uppdateringar',
      platformUpdates: 'Plattformsuppdateringar',
      pushNotifications: 'Push-notifieringar',
      publicProfile: 'Offentlig profil',
      discoverableStories: 'Upptäckbara berättelser'
    },

    // Review Step
    review: {
      title: 'Granska dina val',
      readyToCreate: 'Redo att skapa din berättelse!',
      ageGroup: 'Åldersgrupp',
      genres: 'Genrer',
      characters: 'Karaktärer',
      storyIdea: 'Berättelseidé',
      aiGenerated: 'AI-genererad',
      custom: 'Anpassad',
      noCharacters: 'Inga karaktärer valda',
      createStoryButton: 'Skapa min berättelse'
    },

    // Messages
    messages: {
      languageUpdated: 'Språkinställning uppdaterad',
      settingsSaved: 'Inställningar sparade',
      profileUpdated: 'Profil uppdaterad',
      storyCreated: 'Berättelse skapad',
      characterCreated: 'Karaktär skapad',
      error: 'Ett fel uppstod',
      tryAgain: 'Försök igen'
    }
  },

  en: {
    // English translations (fallback)
    ui: {
      settings: 'Settings',
      profile: 'Profile',
      language: 'Language',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      saving: 'Saving...',
      create: 'Create',
      next: 'Next',
      back: 'Back',
      finish: 'Finish',
      generating: 'Generating...',
      complete: 'Complete',
      error: 'Error',
      success: 'Success'
      , completeLabel: 'Complete', step: 'Step', of: 'of'
    },
    storyCreation: {
      title: 'Create Your Story',
      selectAge: 'Select Age Group',
      selectGenre: 'Select Genre',
      selectCharacters: 'Select Characters',
      storyIdeas: 'Story Ideas',
      createStory: 'Create My Story',
      steps: {
        language: 'Language',
        ageAndGenre: 'Age & Genre',
        characters: 'Characters',
        storyIdeas: 'Story Ideas',
        review: 'Review'
      },
      languageInstruction: 'Stories will be generated in the selected language. You can translate later.'
    },
    ageGroups: {
      '4-6': {
        label: '4-6 Years',
        description: 'Simple stories with basic vocabulary'
      },
      '7-9': {
        label: '7-9 Years',
        description: 'Adventure stories with some complexity'
      },
      '10-12': {
        label: '10-12 Years',
        description: 'Rich narratives with deeper themes'
      },
      '13+': {
        label: '13+ Years',
        description: 'Complex stories with mature themes'
      }
    },
    genres: {
      'Fantasy': {
        name: 'Fantasy',
        description: 'Magical worlds, mythical creatures, and enchanted adventures'
      },
      'Adventure': {
        name: 'Adventure',
        description: 'Exciting journeys, exploration, and thrilling challenges'
      },
      'Mystery': {
        name: 'Mystery',
        description: 'Puzzles to solve, secrets to uncover, and clues to follow'
      },
      'Superhero Stories': {
        name: 'Superhero Stories',
        description: 'Extraordinary powers, heroic deeds, and saving the day'
      },
      'Animal Stories': {
        name: 'Animal Stories',
        description: 'Adventures with animal friends and nature exploration'
      },
      'Fairy Tales': {
        name: 'Fairy Tales',
        description: 'Classic story elements, moral lessons, and timeless themes'
      }
    },
    characters: {
      title: 'Choose Your Characters',
      createNew: 'Create New',
      name: 'Name',
      description: 'Description',
      personality: 'Personality',
      backstory: 'Backstory',
      select: 'Select up to {max} characters for your story. These characters will be featured in your AI-generated story seeds.',
      noCharacters: 'No Characters Yet',
      noCharactersDesc: 'Create your first character to get started with personalized stories',
      createFirst: 'Create Your First Character',
      selected: 'Selected',
      count: '{selected}/{max}'
    },
    storySeeds: {
      title: 'Story Ideas',
      subtitle: 'Choose an idea to start your story',
      description: 'Our AI has created personalized story ideas based on your age group, genres, and characters. Pick one to start with, or write your own custom idea.',
      generating: 'Generating story ideas...',
      regenerate: 'Generate New Ideas',
      aiGenerated: 'AI-Generated Ideas',
      customIdea: 'Custom Story Idea',
      writeOwn: 'Write My Own',
      useAiIdeas: 'Use AI Ideas',
      yourStoryIdea: 'Your Story Idea',
      customPlaceholder: 'Write your own story idea for {ageGroup} readers in the {genres} genre... Feel free to include {characters} in your story!',
      customInstructions: 'Describe the beginning of your story and the situation that will lead to choices.',
      writeYourOwn: 'Write Your Own Story Idea',
      customPremise: 'Create a completely custom story premise',
      storyCharacters: 'Story Characters',
      selected: 'Selected'
    },
    voice: {
      title: 'Voice & Audio',
      selectVoice: 'Select Voice',
      enableAudio: 'Enable Audio Narration',
      play: 'Play',
      pause: 'Pause',
      download: 'Download'
    },
    settings: {
      profileInfo: 'Profile Information',
      notificationPrefs: 'Notification Preferences',
      privacySecurity: 'Privacy & Security',
      accountSummary: 'Account Summary',
      preferredLanguage: 'Preferred Language',
      fullName: 'Full Name',
      displayName: 'Display Name',
      bio: 'Bio',
      email: 'Email',
      plan: 'Plan',
      credits: 'Credits',
      storyUpdates: 'Story Updates',
      platformUpdates: 'Platform Updates',
      pushNotifications: 'Push Notifications',
      publicProfile: 'Public Profile',
      discoverableStories: 'Discoverable Stories'
    },

    // Review Step
    review: {
      title: 'Review Your Choices',
      readyToCreate: 'Ready to create your story!',
      ageGroup: 'Age Group',
      genres: 'Genres',
      characters: 'Characters',
      storyIdea: 'Story Idea',
      aiGenerated: 'AI-generated',
      custom: 'Custom',
      noCharacters: 'No characters selected',
      createStoryButton: 'Create My Story'
    },

    // Messages
    messages: {
      languageUpdated: 'Language preference updated',
      settingsSaved: 'Settings saved',
      profileUpdated: 'Profile updated',
      storyCreated: 'Story created',
      characterCreated: 'Character created',
      error: 'An error occurred',
      tryAgain: 'Try again'
    }
  }
};

// Helper function to get translated text
export const t = (key: string, language: string = 'en'): string => {
  const keys = key.split('.');
  let value: any = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key; // Return key if translation not found
};

// Swedish voice mappings for ElevenLabs
// Using actual ElevenLabs voice IDs that support multilingual v2
export const SWEDISH_VOICES = {
  'male': ['x0u3EW21dbrORJzOq1m9', 'kkwvaJeTPw4KK0sBdyvD'],  // Adam, J.Bengt
  'female': ['aSLKtNoVBZlxQEMsnGL2', '4Ct5uMEndw4cJ7q0Jx0l'],  // Sanna, Elin
  'neutral': []
};

export const VOICE_LANGUAGE_MAP = {
  'sv': SWEDISH_VOICES,
  'en': {
    'male': ['CwhRBWXzGAHq8TQ4Fs17', 'TX3LPaxmHKxFdv7VOQHJ'],  // Roger, Liam
    'female': ['9BWtsMINqrJLrRacOk9x', 'EXAVITQu4vr4xnSDxMaL', 'XB0fDUnXU5powFXDhCwa'],  // Aria, Sarah, Charlotte
    'neutral': []
  }
};