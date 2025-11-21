import React, { useState, useRef } from 'react';
import { animateCharacterVideo } from '../services/geminiService';
import { GeneratedImage } from '../types';

interface AnimationPanelProps {
  selectedImage: GeneratedImage | null;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({ selectedImage }) => {
  const [prompt, setPrompt] = useState('自然な呼吸、優しく瞬き、わずかな頭の動き、カメラ目線、ループ動画');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localImage, setLocalImage] = useState<GeneratedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine selected image from prop or locally uploaded
  const activeImage = selectedImage || localImage;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract base64 data part
      const base64Data = base64String.split(',')[1];
      
      setLocalImage({
        id: 'local',
        url: base64String,
        prompt: 'アップロードされた画像',
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnimate = async () => {
    if (!activeImage || !activeImage.base64 || !activeImage.mimeType) {
      setError("有効な画像が選択されていません");
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const url = await animateCharacterVideo(activeImage.base64, activeImage.mimeType, prompt);
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '動画生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
             <span className="text-violet-400">2.</span> 動画化 (Veo)
          </h2>
          
          {!selectedImage && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">元画像を選択</label>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleFileUpload}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-violet-500 hover:bg-gray-800/50 transition-colors"
              >
                {localImage ? (
                  <img src={localImage.url} alt="Upload" className="h-32 mx-auto object-contain rounded" />
                ) : (
                  <div className="text-gray-500">
                    <span className="block text-2xl mb-2">📂</span>
                    <span className="text-sm">画像をアップロードするか、左のタブで生成してください</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="mb-6 p-3 bg-gray-800 rounded-lg flex items-center gap-3">
               <img src={selectedImage.url} alt="Selected" className="w-12 h-16 object-cover rounded" />
               <div className="text-sm overflow-hidden">
                 <p className="text-gray-300 truncate">ジェネレーターから選択中</p>
                 <p className="text-gray-500 text-xs truncate">{selectedImage.id}</p>
               </div>
            </div>
          )}

          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-300 mb-2">モーション指示 (プロンプト)</label>
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
             />
             <p className="text-xs text-gray-500 mt-2">
               ヒント: 「呼吸する」「瞬きする」「微笑む」などの小さな動きを指定すると、アバターらしい自然な仕上がりになります。
             </p>
          </div>

          <button
            onClick={handleAnimate}
            disabled={loading || !activeImage}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              loading || !activeImage
                ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                : 'bg-violet-600 hover:bg-violet-500 text-white animate-pulse-glow'
            }`}
          >
             {loading ? '動画を処理中...' : 'ループ動画を生成'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="lg:col-span-8 flex items-center justify-center bg-black/40 rounded-xl border border-gray-800 min-h-[400px]">
        {loading ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-violet-300 animate-pulse">Veoでアニメーションを生成中...</p>
            <p className="text-xs text-gray-500">30〜60秒ほどかかる場合があります</p>
          </div>
        ) : videoUrl ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
             <video 
               src={videoUrl} 
               autoPlay 
               loop 
               controls 
               className="max-h-[600px] max-w-full rounded-lg shadow-2xl shadow-violet-900/20"
             />
             <div className="mt-4 flex gap-3">
               <a 
                 href={videoUrl} 
                 download="avatar-animation.mp4"
                 className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
               >
                 MP4をダウンロード
               </a>
             </div>
          </div>
        ) : (
          <div className="text-gray-600 text-center">
            <div className="text-4xl mb-2">🎬</div>
            <p>動画プレビューがここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationPanel;