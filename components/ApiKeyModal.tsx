import React, { useEffect, useState } from 'react';
import { AIStudioClient } from '../types';

const ApiKeyModal: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true); // Assume true initially to prevent flash

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkKey = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      try {
        const status = await aistudio.hasSelectedApiKey();
        setHasKey(status);
      } catch (e) {
        console.error("Failed to check API key status", e);
        setHasKey(false);
      }
    }
  };

  const handleConnect = async () => {
    const aistudio = (window as any).aistudio as AIStudioClient | undefined;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Give it a moment to propagate or assume success as per guidelines
      setHasKey(true); 
    }
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          🔑
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">APIキーが必要です</h2>
        <p className="text-gray-400 mb-6">
          高度な動画生成機能 (Veo) を使用するには、Google AI StudioのAPIキーを選択する必要があります。
        </p>
        
        <button
          onClick={handleConnect}
          className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all transform active:scale-95 shadow-lg shadow-violet-500/25"
        >
          Google AI Studioと連携する
        </button>

        <div className="mt-6 text-xs text-gray-500">
          料金の詳細については <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">課金ドキュメント</a> をご確認ください。
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;