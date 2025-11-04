import React, { useState } from 'react';
import type { StoryConfig } from '../types';
import { MagicWandIcon, BookOpenIcon, SparklesIcon, SpeakerWaveIcon, ArrowPathIcon, FilmIcon, StarIcon, UserCircleIcon, Bars3Icon, ChevronDownIcon, XMarkIcon } from './IconComponents';

interface LandingPageProps {
  onStartStory: (config: StoryConfig) => void;
  onResumeStory: () => void;
  hasSavedStory: boolean;
}

const NavLink = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick} className="text-gray-300 hover:text-white transition-colors bg-transparent border-none p-0">
        {children}
    </button>
);

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
    <header className="absolute top-0 left-0 right-0 z-20 py-4 px-6 md:px-12 flex justify-between items-center">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-2">
            <img src="https://storage.googleapis.com/aai-web-samples/tale-forge-logo.png" alt="Tale Forge Logo" className="w-8 h-8"/>
            <h1 className="text-2xl font-bold font-cinzel text-yellow-300">TALE FORGE</h1>
        </div>
        
        {/* Middle: Centered Navigation for Desktop */}
        <nav className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
            <NavLink>Discover</NavLink>
            <NavLink>Dashboard</NavLink>
            <NavLink>My Stories</NavLink>
            <NavLink>About</NavLink>
            <NavLink>Testimonials</NavLink>
            <NavLink>Pricing</NavLink>
        </nav>

        {/* Right Side: User Actions for Desktop */}
        <div className="hidden md:flex items-center gap-4">
            <button className="border border-white/50 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors">
                Feedback
            </button>
            <div className="flex items-center gap-2 text-white">
                <UserCircleIcon className="w-6 h-6" />
                <span>johndoe</span>
                <ChevronDownIcon className="w-4 h-4" />
            </div>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-white z-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
        </button>

        {/* Mobile Menu Panel */}
        <div className={`fixed top-0 right-0 h-full w-full max-w-xs bg-black/90 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <nav className="flex flex-col items-start gap-6 p-8 pt-24 text-lg">
                <NavLink onClick={() => setIsMenuOpen(false)}>Discover</NavLink>
                <NavLink onClick={() => setIsMenuOpen(false)}>Dashboard</NavLink>
                <NavLink onClick={() => setIsMenuOpen(false)}>My Stories</NavLink>
                <NavLink onClick={() => setIsMenuOpen(false)}>About</NavLink>
                <NavLink onClick={() => setIsMenuOpen(false)}>Testimonials</NavLink>
                <NavLink onClick={() => setIsMenuOpen(false)}>Pricing</NavLink>
                <div className="border-t border-white/20 w-full my-4"></div>
                <button className="border border-white/50 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors w-full text-left text-base">
                    Feedback
                </button>
                <div className="flex items-center gap-3 text-white w-full">
                    <UserCircleIcon className="w-10 h-10" />
                    <div className="flex-grow">
                        <span className="font-bold">johndoe</span>
                        <span className="text-sm text-gray-400 block">View Profile</span>
                    </div>
                     <ChevronDownIcon className="w-6 h-6" />
                </div>
            </nav>
        </div>
        
        {/* Overlay for when menu is open */}
        {isMenuOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setIsMenuOpen(false)}></div>}
    </header>
    )
};


const LandingPage: React.FC<LandingPageProps> = ({ onStartStory, onResumeStory, hasSavedStory }) => {
  const [childName, setChildName] = useState('');
  const [theme, setTheme] = useState('Fantasy');
  const [character, setCharacter] = useState('');
  
  // Wizard-specific state
  const [mode, setMode] = useState<'simple' | 'wizard'>('simple');
  const [ageGroup, setAgeGroup] = useState('4-6 years old');
  const [traits, setTraits] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (childName && theme && character) {
        const config: StoryConfig = { childName, theme, character };
        if (mode === 'wizard') {
            config.ageGroup = ageGroup;
            config.traits = traits.trim() ? traits : undefined;
            config.customPrompt = customPrompt.trim() ? customPrompt : undefined;
        }
        onStartStory(config);
    }
  };
  
  const handleScrollToCreate = () => {
    const element = document.getElementById('create-story');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const genres = ["Fantasy", "Space Adventure", "Mystery", "Talking Animals", "Underwater World", "Fairy Tale", "Superhero"];
  const ageGroups = ["4-6 years old", "7-9 years old", "10-12 years old", "13+ years old"];

  return (
    <div className="min-h-screen w-full text-white">
        <Header />
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center p-4 relative">
            <div className="relative z-10 flex flex-col items-center text-shadow-strong">
                <h2 className="text-7xl md:text-8xl font-bold mb-4 font-cinzel text-yellow-300" style={{ textShadow: '0 0 15px rgba(252, 211, 77, 0.5)' }}>TALE FORGE</h2>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-200">Where every story becomes an adventure</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button onClick={handleScrollToCreate} className="bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-300 transform hover:-translate-y-1 transition-all duration-300 shadow-[0_0_15px_rgba(252,211,77,0.5)] hover:shadow-[0_0_25px_rgba(252,211,77,0.8)]">
                        Create Story
                    </button>
                    <button className="bg-transparent border border-purple-400 hover:bg-purple-500/20 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(192,132,252,0.5)] hover:shadow-[0_0_25px_rgba(192,132,252,0.8)] transform hover:-translate-y-1 transition-all duration-300">
                        Explore Stories
                    </button>
                     {hasSavedStory && (
                        <button onClick={onResumeStory} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)]">
                            Resume Last Adventure
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="flex text-yellow-400">
                        <StarIcon className="w-4 h-4" /><StarIcon className="w-4 h-4" /><StarIcon className="w-4 h-4" /><StarIcon className="w-4 h-4" /><StarIcon className="w-4 h-4" />
                    </div>
                    <span><span className="font-bold text-white">5.0</span> from 35k+ reviews</span>
                </div>
                
            </div>
        </section>
        
        {/* Create Story Form Section */}
        <section id="create-story" className="py-20 px-4">
             <div className="w-full max-w-lg mx-auto text-shadow-strong rounded-2xl p-8 shadow-2xl border border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.3)]">
                <h2 className="text-3xl font-bold text-center mb-2 font-cinzel text-yellow-300">Let's Begin Your Tale!</h2>
                <p className="text-center text-lg mb-6 text-gray-300">Choose your path to adventure.</p>
                
                <div className="flex justify-center border-b border-white/20 mb-6">
                    <button onClick={() => setMode('simple')} className={`px-6 py-2 font-bold transition ${mode === 'simple' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-white'}`}>
                        Quick Start
                    </button>
                    <button onClick={() => setMode('wizard')} className={`px-6 py-2 font-bold transition ${mode === 'wizard' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-white'}`}>
                        Story Wizard
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="childName" className="block text-sm font-bold mb-2">What's your name, hero?</label>
                        <input
                            id="childName"
                            type="text"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            placeholder="e.g., Lily"
                            className="w-full px-4 py-3 rounded-lg bg-transparent border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="character" className="block text-sm font-bold mb-2">Who is the story about?</label>
                        <input
                            id="character"
                            type="text"
                            value={character}
                            onChange={(e) => setCharacter(e.target.value)}
                            placeholder="e.g., a brave squirrel named Squeaky"
                            className="w-full px-4 py-3 rounded-lg bg-transparent border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="theme" className="block text-sm font-bold mb-2">Choose a genre:</label>
                        <div className="relative">
                            <select
                                id="theme"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-lg bg-transparent border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition appearance-none"
                            >
                                {genres.map(t => <option key={t} value={t} className="bg-gray-800 text-white">{t}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    
                    {mode === 'wizard' && (
                        <>
                           <div>
                                <label htmlFor="ageGroup" className="block text-sm font-bold mb-2">Age Group</label>
                                <div className="relative">
                                    <select id="ageGroup" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full pl-4 pr-10 py-3 rounded-lg bg-transparent border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition appearance-none">
                                        {ageGroups.map(ag => <option key={ag} value={ag} className="bg-gray-800 text-white">{ag}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <ChevronDownIcon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="traits" className="block text-sm font-bold mb-2">Character Traits</label>
                                <input id="traits" type="text" value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="e.g., brave, curious, loves cookies" className="w-full px-4 py-3 rounded-lg bg-transparent border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition"/>
                            </div>
                            <div>
                                <label htmlFor="customPrompt" className="block text-sm font-bold mb-2">Opening Scene (Optional)</label>
                                <textarea id="customPrompt" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} placeholder="In a cozy burrow under a great oak tree..." className="w-full px-4 py-3 rounded-lg bg-transparent border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.7)] transition"></textarea>
                            </div>
                        </>
                    )}


                    <button 
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-yellow-300 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(252,211,77,0.5)] hover:shadow-[0_0_25px_rgba(252,211,77,0.8)]"
                        disabled={!childName || !character}
                    >
                        <MagicWandIcon className="w-6 h-6" />
                        Forge My Tale!
                    </button>
                </form>
            </div>
        </section>
        
        <footer className="text-center p-8 text-gray-400 text-shadow-strong">
            <p>&copy; {new Date().getFullYear()} Tale Forge. Weaving dreams with AI.</p>
        </footer>
    </div>
  );
};

export default LandingPage;