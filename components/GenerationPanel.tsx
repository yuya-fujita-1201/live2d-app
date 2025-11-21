import React, { useState } from 'react';
import { generateCharacterImage } from '../services/geminiService';
import { GeneratedImage } from '../types';

interface GenerationPanelProps {
  onImageSelect: (img: GeneratedImage) => void;
}

const GenerationPanel: React.FC<GenerationPanelProps> = ({ onImageSelect }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Append style modifiers but keep user prompt as main driver
      const fullPrompt = `Anime style character reference sheet, white background, high quality, vtuber model, detailed, ${prompt}`;
      const result = await generateCharacterImage(fullPrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: prompt,
        url: `data:${result.mimeType};base64,${result.base64}`,
        base64: result.base64,
        mimeType: result.mimeType
      };

      setHistory(prev => [newImage, ...prev]);
      onImageSelect(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Input Section */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-violet-400">1.</span> キャラクター作成
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            VTuberアバターの特徴を記述してください。<b>Imagen 4</b> を使用して、リギングに適したクリーンで高品質な立ち絵を生成します。
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例：ネオンブルーの髪を持つサイバーパンクな猫耳少女、未来的なジャケット、自信に満ちた表情、正面図..."
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none mb-4"
          />

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </>
            ) : (
              'アバターを生成'
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 flex flex-col">
        <h2 className="text-lg font-medium text-gray-400 mb-4">生成履歴</h2>
        
        {history.length === 0 ? (
          <div className="flex-1 bg-gray-900/50 border border-gray-800 border-dashed rounded-xl flex items-center justify-center text-gray-600">
            キャラクターはまだ生成されていません。
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-[600px]">
            {history.map((img) => (
              <div 
                key={img.id} 
                className="group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500 cursor-pointer transition-all"
                onClick={() => onImageSelect(img)}
              >
                <img 
                  src={img.url} 
                  alt={img.prompt} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-xs text-gray-300 line-clamp-2">{img.prompt}</p>
                  <span className="text-xs text-violet-300 font-bold mt-1">このモデルを使用</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationPanel;