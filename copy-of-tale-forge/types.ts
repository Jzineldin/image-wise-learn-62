export interface Choice {
  choiceText: string;
  nextPrompt: string;
}

export interface StoryPage {
  id: number;
  pageText: string;
  imageUrl: string;
  audioData: string;
  choices: Choice[];
  videoUrl?: string;
  isVideoLoading?: boolean;
}

export interface StoryConfig {
  childName: string;
  theme: string;
  character: string;
  ageGroup?: string;
  traits?: string;
  customPrompt?: string;
}

export interface VoiceOption {
  name: string;
  id: string;
}

export interface SavedStoryState {
  storyPages: StoryPage[];
  currentPageIndex: number;
  storyConfig: StoryConfig;
}
