/**
 * UI-specific helper functions
 */

/**
 * Generate loading states for UI components
 */
export const generateLoadingText = (operation: string): string[] => {
  const loadingTexts = {
    story: [
      'Crafting your adventure...',
      'Weaving magical tales...',
      'Creating characters...',
      'Building worlds...',
      'Almost ready!'
    ],
    image: [
      'Painting your scene...',
      'Adding magical details...',
      'Creating artwork...',
      'Bringing story to life...',
      'Finalizing illustration...'
    ],
    audio: [
      'Recording narration...',
      'Adding voice magic...',
      'Creating audio experience...',
      'Perfecting pronunciation...',
      'Almost ready to listen!'
    ]
  };

  return loadingTexts[operation as keyof typeof loadingTexts] || ['Processing...'];
};

/**
 * Get random encouraging message
 */
export const getRandomEncouragement = (): string => {
  const encouragements = [
    'Your creativity is amazing!',
    'This story is going to be fantastic!',
    'Keep up the great storytelling!',
    'Your imagination knows no bounds!',
    'What an exciting adventure!',
    'This is turning out beautifully!',
    'Your story is coming to life!',
    'Brilliant storytelling ahead!'
  ];

  return encouragements[Math.floor(Math.random() * encouragements.length)];
};

/**
 * Generate color based on string hash (for avatars, etc.)
 */
export const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-teal-500'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Animate element entrance
 */
export const animateElementEntrance = (element: HTMLElement, delay = 0) => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }, delay);
};

/**
 * Copy text to clipboard with feedback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};