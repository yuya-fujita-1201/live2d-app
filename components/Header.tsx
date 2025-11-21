
import React from 'react';
import { AppMode, AIStudioClient } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ currentMode, setMode }) => {
  const handleChangeKey = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  };

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white">
            L2
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-100">
            Live2D<span className="text-violet-400">AI</span> Studio
          </span>
        </div>

        <nav className="flex bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setMode(AppMode.GENERATE)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentMode === AppMode.GENERATE
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            モデル生成 (簡易)
          </button>
          <button
            onClick={() => setMode(AppMode.LAYER_GEN)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentMode === AppMode.LAYER_GEN
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            詳細レイヤー生成
          </button>
          <button
            onClick={() => setMode(AppMode.ANIMATE)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentMode === AppMode.ANIMATE
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            動画化 (Veo)
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono hidden md:block">
            Powered by Gemini 2.5 & Veo
          </div>
          <button 
            onClick={handleChangeKey}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 transition-colors"
            title="APIキーを変更または再選択"
          >
            APIキー設定
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
