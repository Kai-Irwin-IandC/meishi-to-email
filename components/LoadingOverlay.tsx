import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl transition-all duration-300">
      <div className="relative w-16 h-16">
        <div className="absolute w-full h-full border-4 border-indigo-200 rounded-full animate-ping opacity-75"></div>
        <div className="absolute w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-indigo-900 font-medium animate-pulse">名刺情報を解析中...</p>
    </div>
  );
};
