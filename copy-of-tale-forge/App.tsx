import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import StoryViewer from './components/StoryViewer';
import StoryLoadingIndicator from './components/StoryLoadingIndicator';
import { generateStoryPage, generateImage } from './services/geminiService';
import { saveStoryState, loadStoryState, hasSavedStory, clearSavedStory } from './utils/storage';
import type { StoryPage, StoryConfig, Choice, VoiceOption } from './types';

type GameState = 'welcome' | 'loading' | 'story';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [storyConfig, setStoryConfig] = useState<StoryConfig | null>(null);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [isStorySaved, setIsStorySaved] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    setIsStorySaved(hasSavedStory());
  }, [gameState]);


  const createNewPage = useCallback(async (config: StoryConfig, prompt: string): Promise<StoryPage> => {
    const { pageText, choices } = await generateStoryPage(config, prompt);
    const imageB64 = await generateImage(pageText);
    const imageUrl = `data:image/png;base64,${imageB64}`;

    return {
      id: Date.now(),
      pageText,
      imageUrl,
      audioData: '', // Audio will be generated on demand
      choices,
    };
  }, []);

  const handleStartStory = useCallback(async (config: StoryConfig) => {
    setGameState('loading');
    setStoryConfig(config);
    clearSavedStory(); // Starting a new story clears the old one
    const firstPrompt = config.customPrompt || `Create the very first page of the story based on the system instructions.`;
    
    try {
      const newPage = await createNewPage(config, firstPrompt);
      setStoryPages([newPage]);
      setCurrentPageIndex(0);
      setGameState('story');
    } catch (error) {
      console.error("Failed to start story:", error);
      setGameState('welcome'); // Reset on error
    }
  }, [createNewPage]);
  
  const handleMakeChoice = useCallback(async (choice: Choice) => {
    if (!storyConfig) return;
    setIsLoadingNextPage(true);
    
    try {
        const newPage = await createNewPage(storyConfig, choice.nextPrompt);
        setStoryPages(prev => [...prev, newPage]);
        setCurrentPageIndex(prev => prev + 1);
    } catch(error) {
        console.error("Failed to create next page:", error);
    } finally {
        setIsLoadingNextPage(false);
    }
  }, [storyConfig, createNewPage]);

  const handlePageUpdate = (pageId: number, updates: Partial<StoryPage>) => {
    setStoryPages(pages => pages.map(p => {
        if (p.id === pageId) {
            return { ...p, ...updates };
        }
        return p;
    }));
  };

  const handleAnimateScene = (pageId: number, videoUrl: string) => {
    handlePageUpdate(pageId, {
        videoUrl: videoUrl === 'error' ? undefined : videoUrl,
        isVideoLoading: videoUrl === '' ? true : false,
    });
  };
  
  const handleSave = () => {
    if (!storyConfig) return;
    saveStoryState({
      storyPages,
      currentPageIndex,
      storyConfig,
    });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  const handleResume = () => {
    const savedState = loadStoryState();
    if (savedState) {
      setStoryPages(savedState.storyPages);
      setCurrentPageIndex(savedState.currentPageIndex);
      setStoryConfig(savedState.storyConfig);
      setGameState('story');
    }
  };

  const handleStartNew = () => {
    if (window.confirm("Are you sure you want to start a new story? Your current progress will be lost unless you save.")) {
        clearSavedStory();
        setStoryPages([]);
        setCurrentPageIndex(0);
        setStoryConfig(null);
        setGameState('welcome');
    }
  };

  const renderContent = () => {
    switch (gameState) {
      case 'welcome':
        return <LandingPage onStartStory={handleStartStory} onResumeStory={handleResume} hasSavedStory={isStorySaved} />;
      case 'loading':
        return (
          <div className="min-h-screen w-full flex items-center justify-center">
            <StoryLoadingIndicator />
          </div>
        );
      case 'story':
        const currentPage = storyPages[currentPageIndex];
        return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl mb-4 p-4 text-shadow-strong border border-yellow-300/50 shadow-[0_0_15px_rgba(252,211,77,0.2)] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl text-yellow-300 font-bold font-cinzel">Tale Forge</h2>
                    <p className="text-sm text-gray-200">Page {currentPageIndex + 1}</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                   <button onClick={handleSave} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition min-w-[120px] hover:shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                        {showSavedMessage ? 'Saved!' : 'Save Story'}
                   </button>
                   <button onClick={handleStartNew} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition hover:shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                        Start New
                   </button>
                </div>
            </div>
            {currentPage && (
              <StoryViewer 
                page={currentPage} 
                onMakeChoice={handleMakeChoice} 
                onAnimateScene={handleAnimateScene}
                onPageUpdate={handlePageUpdate}
                isLoadingNextPage={isLoadingNextPage}
              />
            )}
            <div className="mt-4 flex gap-4">
              {currentPageIndex > 0 && <button onClick={() => setCurrentPageIndex(p => p - 1)} className="border border-white/50 text-white font-bold py-2 px-6 rounded-lg hover:bg-white/20 transition hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]">Previous</button>}
              {currentPageIndex < storyPages.length - 1 && <button onClick={() => setCurrentPageIndex(p => p + 1)} className="border border-white/50 text-white font-bold py-2 px-6 rounded-lg hover:bg-white/20 transition hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]">Next</button>}
            </div>
          </div>
        );
      default:
        return <LandingPage onStartStory={handleStartStory} onResumeStory={handleResume} hasSavedStory={isStorySaved} />;
    }
  };

  return <div className="min-h-screen">{renderContent()}</div>;
};

export default App;