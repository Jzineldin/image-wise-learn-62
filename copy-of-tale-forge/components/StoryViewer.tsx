import React, { useState, useEffect, useCallback } from 'react';
import type { StoryPage, Choice, VoiceOption, StoryConfig } from '../types';
import { playNarration } from '../utils/audioUtils';
import { generateVideo, generateNarration } from '../services/geminiService';
import LoadingIndicator from './LoadingIndicator';
import { PlayIcon, FilmIcon, SpeakerWaveIcon } from './IconComponents';
import StoryLoadingIndicator from './StoryLoadingIndicator';

interface StoryViewerProps {
  page: StoryPage;
  onMakeChoice: (choice: Choice) => void;
  onAnimateScene: (pageId: number, videoUrl: string) => void;
  onPageUpdate: (pageId: number, updates: Partial<StoryPage>) => void;
  isLoadingNextPage: boolean;
}

const VOICES: VoiceOption[] = [
  { name: "Friendly Narrator", id: "Kore" },
  { name: "Adventurous Hero", id: "Puck" },
  { name: "Wise Owl", id: "Charon" },
  { name: "Gentle Giant", id: "Fenrir" },
  { name: "Mystical Sprite", id: "Zephyr" },
];

const ApiKeySelector: React.FC<{onKeySelected: () => void}> = ({ onKeySelected }) => {
    const [hasKey, setHasKey] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkKey = async () => {
            try {
                if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                    setHasKey(true);
                    onKeySelected();
                }
            } catch (error) {
                console.error("Error checking for API key:", error);
            } finally {
                setIsChecking(false);
            }
        };
        checkKey();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume success and optimistically update UI
            setHasKey(true);
            onKeySelected();
        } catch (error) {
            console.error("Error opening API key selector:", error);
        }
    };
    
    if (isChecking) return <div className="text-white text-center">Checking for video API key...</div>;

    if (!hasKey) {
        return (
            <div className="bg-red-800/50 p-4 rounded-lg text-center">
                <p className="mb-2">To create a video, you need to select a Gemini API key.</p>
                <p className="mb-4 text-sm">Video generation is powered by Veo. For details on billing, see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">here</a>.</p>
                <button onClick={handleSelectKey} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Select API Key
                </button>
            </div>
        );
    }

    return null; // Key is selected, component does nothing.
};

const StoryViewer: React.FC<StoryViewerProps> = ({ page, onMakeChoice, onAnimateScene, onPageUpdate, isLoadingNextPage }) => {
    const [showKeySelector, setShowKeySelector] = useState(false);
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [includeVideoNarration, setIncludeVideoNarration] = useState(false);

    const handleAnimateClick = () => {
        if (!isKeySelected) {
            setShowKeySelector(true);
        } else {
            initiateVideoGeneration();
        }
    };

    const initiateVideoGeneration = useCallback(async () => {
        if (page.videoUrl || page.isVideoLoading) return;
        
        onAnimateScene(page.id, ''); // Set loading state
        setVideoError(null);

        try {
            const videoUrl = await generateVideo(page.imageUrl.split(',')[1], page.pageText, includeVideoNarration);
            onAnimateScene(page.id, videoUrl);
        } catch (error: any) {
            console.error("Video generation failed:", error);
            let errorMessage = "Animation failed. Please try again.";
            if (error?.message?.includes("Requested entity was not found")) {
                errorMessage = "API Key not found. Please re-select your key.";
                setIsKeySelected(false); // Reset key state
                setShowKeySelector(true);
            }
            setVideoError(errorMessage);
            onAnimateScene(page.id, 'error'); // Clear loading state on error
        }
    }, [page, onAnimateScene, includeVideoNarration]);


    useEffect(() => {
        if (isKeySelected) {
            initiateVideoGeneration();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isKeySelected]);
    
    const handlePlayNarration = async () => {
        if (isGeneratingAudio) return;

        if (page.audioData) {
            playNarration(page.audioData);
            return;
        }

        setIsGeneratingAudio(true);
        try {
            const newAudioData = await generateNarration(page.pageText, selectedVoice.id);
            onPageUpdate(page.id, { audioData: newAudioData });
            playNarration(newAudioData);
        } catch (error) {
            console.error("Failed to generate narration:", error);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVoice = VOICES.find(v => v.id === e.target.value) || VOICES[0];
        setSelectedVoice(newVoice);
        // Clear existing audio data for this page, so it regenerates with the new voice
        if (page.audioData) {
            onPageUpdate(page.id, { audioData: '' });
        }
    };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
      <div className="relative aspect-video rounded-2xl shadow-lg overflow-hidden flex items-center justify-center border border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
        {page.isVideoLoading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 text-white text-center p-4">
                <LoadingIndicator message="Animating your scene..." />
                <p className="mt-4 text-sm">This can take a few minutes. Magic is in the making!</p>
            </div>
        )}
        {videoError && (
             <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-20 text-white p-4 text-center">
                <p>{videoError}</p>
            </div>
        )}
        {page.videoUrl && page.videoUrl !== 'error' ? (
            <video src={page.videoUrl} controls autoPlay loop className="w-full h-full object-cover"/>
        ) : (
            <img src={page.imageUrl} alt="Story illustration" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex flex-col justify-between text-white text-shadow-strong p-6 rounded-2xl shadow-lg border border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
        <p className="text-xl md:text-2xl leading-relaxed mb-6 font-serif">{page.pageText}</p>
        
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 p-2 rounded-lg border border-white/10">
                    <SpeakerWaveIcon className="w-6 h-6 text-pink-400"/>
                    <select 
                        id="voice-select"
                        value={selectedVoice.id}
                        onChange={handleVoiceChange}
                        className="bg-transparent text-white rounded-md w-full focus:outline-none focus:ring-0"
                    >
                        {VOICES.map(voice => <option key={voice.id} value={voice.id} className="bg-gray-800">{voice.name}</option>)}
                    </select>
                </div>
                <button onClick={handlePlayNarration} disabled={isGeneratingAudio} className="flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 border border-pink-400 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] disabled:bg-gray-500 disabled:cursor-not-allowed">
                    <PlayIcon className="w-5 h-5" />
                    {isGeneratingAudio ? 'Generating...' : 'Play Narration'}
                </button>
                 {!page.videoUrl && (
                    <div className="sm:col-span-2">
                        <button onClick={handleAnimateClick} disabled={page.isVideoLoading} className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 border border-sky-400 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <FilmIcon className="w-5 h-5" />
                            Animate Scene
                        </button>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <input
                                type="checkbox"
                                id={`narration-checkbox-${page.id}`}
                                checked={includeVideoNarration}
                                onChange={(e) => setIncludeVideoNarration(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 bg-white/10"
                            />
                            <label htmlFor={`narration-checkbox-${page.id}`} className="text-sm text-gray-200">
                                Include AI narration in video
                            </label>
                        </div>
                    </div>
                )}
            </div>
            
            {showKeySelector && !isKeySelected && <ApiKeySelector onKeySelected={() => {setIsKeySelected(true); setShowKeySelector(false);}} />}

            {isLoadingNextPage ? (
                 <StoryLoadingIndicator />
            ) : (
                <div className="space-y-4">
                {page.choices.map((choice, index) => (
                    <button
                    key={index}
                    onClick={() => onMakeChoice(choice)}
                    className="w-full text-left bg-purple-600 hover:bg-purple-700 border border-purple-400 text-white font-bold p-4 rounded-lg transition-transform transform hover:scale-102 hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]"
                    >
                    {choice.choiceText}
                    </button>
                ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;