import React, { useState } from 'react';
import Header from './components/Header';
import GenerationPanel from './components/GenerationPanel';
import AnimationPanel from './components/AnimationPanel';
import LayerGenerator from './components/LayerGenerator';
import ApiKeyModal from './components/ApiKeyModal';
import { AppMode, GeneratedImage } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const handleImageSelect = (img: GeneratedImage) => {
    setSelectedImage(img);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-10">
      <ApiKeyModal />
      <Header currentMode={mode} setMode={setMode} />
      
      <main className="max-w-7xl mx-auto px-4 pt-8 h-[calc(100vh-6rem)]">
        {mode === AppMode.GENERATE && (
          <GenerationPanel onImageSelect={handleImageSelect} />
        )}
        
        {mode === AppMode.ANIMATE && (
          <AnimationPanel selectedImage={selectedImage} />
        )}

        {mode === AppMode.LAYER_GEN && (
          <LayerGenerator selectedImage={selectedImage} />
        )}
      </main>
    </div>
  );
};

export default App;