
import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white p-8">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 bg-sky-400 rounded-full animate-bounce"></div>
      </div>
      <p className="mt-4 text-xl font-bold tracking-wider">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
