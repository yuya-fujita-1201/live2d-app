import React, { useState } from 'react';
import { LayerDefinition, LayerId, GeneratedLayer, GeneratedImage } from '../types';
import { LAYER_DEFS } from '../constants/layers';
import { generateLayerImage, analyzeCharacterDescription } from '../services/geminiService';
import { writePsd } from 'ag-psd';

interface LayerGeneratorProps {
  selectedImage: GeneratedImage | null;
}

const LayerGenerator: React.FC<LayerGeneratorProps> = ({ selectedImage }) => {
  const [globalPrompt, setGlobalPrompt] = useState("Cute anime girl, blue hair, school uniform, cool personality");
  const [layers, setLayers] = useState<Map<LayerId, GeneratedLayer>>(new Map());
  const [generating, setGenerating] = useState<Set<LayerId>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewLayer, setPreviewLayer] = useState<GeneratedLayer | null>(null);

  const toggleGenerating = (id: LayerId, state: boolean) => {
    setGenerating(prev => {
      const next = new Set(prev);
      if (state) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAnalyzeReference = async () => {
    if (!selectedImage || !selectedImage.base64) return;
    setAnalyzing(true);
    try {
      const description = await analyzeCharacterDescription(selectedImage.base64, selectedImage.mimeType || 'image/png');
      setGlobalPrompt(description);
    } catch(e) {
       console.error(e);
       alert("画像の分析に失敗しました。");
    } finally {
       setAnalyzing(false);
    }
  };

  // Internal helper to generate a single layer without UI alerts (throws error instead)
  const generateLayerInternal = async (layerDef: LayerDefinition, prompt: string) => {
      toggleGenerating(layerDef.id, true);
      try {
        const blob = await generateLayerImage(layerDef, prompt);
        const url = URL.createObjectURL(blob);
        
        setLayers(prev => {
          const next = new Map(prev);
          next.set(layerDef.id, { id: layerDef.id, blob, url });
          return next;
        });
        return true;
      } finally {
        toggleGenerating(layerDef.id, false);
      }
  };

  const handleGenerateSingle = async (layerDef: LayerDefinition) => {
    if (!globalPrompt.trim()) {
      alert("全体設定のプロンプトを入力してください");
      return;
    }
    try {
      await generateLayerInternal(layerDef, globalPrompt);
    } catch (e) {
      console.error(e);
      alert(`生成失敗: ${layerDef.descriptionJa}\n${(e as Error).message}`);
    }
  };

  const handleGenerateAllRequired = async () => {
    if (!globalPrompt.trim()) {
      alert("全体設定のプロンプトを入力してください");
      return;
    }

    const required = LAYER_DEFS.filter(l => l.required);
    if (required.length === 0) return;

    // Reset progress and start
    setBatchProgress({ current: 0, total: required.length });
    
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < required.length; i++) {
      const layer = required[i];
      
      // Update progress display
      setBatchProgress({ current: i + 1, total: required.length });
      
      try {
        await generateLayerInternal(layer, globalPrompt);
        successCount++;
      } catch (e) {
        console.error(`Error generating ${layer.id}`, e);
        errors.push(`${layer.descriptionJa}: ${(e as Error).message}`);
        // Continue to next layer even if one fails
      }
    }

    setBatchProgress(null);

    if (errors.length > 0) {
      alert(`生成完了 (${successCount}/${required.length} 成功)\n\n以下のレイヤーでエラーが発生しました:\n${errors.join('\n')}`);
    } else {
      // Optional: unobtrusive notification
      // alert("全必須パーツの生成が完了しました！");
    }
  };

  const blobToCanvas = (blob: Blob): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(c);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  };

  const handleExportPSD = async () => {
    if (layers.size === 0) return;
    setIsExporting(true);

    try {
      // 1. Prepare Layers
      // We need to sort them by Z-Order (ascending: smaller zOrder is background)
      // In PSD children array, index 0 is bottom.
      const sortedLayers = LAYER_DEFS
        .filter(def => layers.has(def.id))
        .sort((a, b) => a.zOrder - b.zOrder);

      if (sortedLayers.length === 0) throw new Error("No layers to export");

      // 2. Convert Blobs to Canvases
      const psdChildren = [];
      
      // Use a default large canvas size. 
      // Since we don't have a "master" layout yet, we'll center everything.
      // Assuming largest asset (Body) is around 1024x1024 or 1024x1365.
      // Let's make the PSD canvas ample size.
      const PSD_WIDTH = 2048;
      const PSD_HEIGHT = 2048;

      for (const def of sortedLayers) {
        const layerData = layers.get(def.id)!;
        const canvas = await blobToCanvas(layerData.blob);
        
        // Simple centering logic
        const left = Math.floor((PSD_WIDTH - canvas.width) / 2);
        const top = Math.floor((PSD_HEIGHT - canvas.height) / 2);

        psdChildren.push({
          name: `${def.descriptionJa} (${def.id})`,
          canvas: canvas,
          left: left,
          top: top,
          // opacity: 1,
          // blendMode: 'normal'
        });
      }

      // 3. Create PSD Object
      const psd = {
        width: PSD_WIDTH,
        height: PSD_HEIGHT,
        children: psdChildren
      };

      // 4. Write and Download
      const buffer = writePsd(psd as any);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Live2D_Assets_${Date.now()}.psd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      console.error(e);
      alert("PSDの保存に失敗しました: " + (e as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full relative">
      {/* Left Panel: Config */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <span className="text-violet-400">1.</span> 全体設定
          </h2>

          {/* Reference Image Section */}
          {selectedImage ? (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">参照画像（モデル生成より）</h3>
              <div className="flex gap-4 items-start">
                <img 
                  src={selectedImage.url} 
                  className="w-20 h-24 object-cover rounded bg-black/40 border border-gray-600" 
                  alt="Reference" 
                />
                <div className="flex flex-col gap-2 flex-1">
                  <button 
                    onClick={() => setGlobalPrompt(selectedImage.prompt)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors text-left flex items-center gap-2"
                  >
                    📝 元のプロンプトをコピー
                  </button>
                  <button 
                    onClick={handleAnalyzeReference}
                    disabled={analyzing}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded transition-colors text-left flex items-center gap-2"
                  >
                    {analyzing ? '✨ 分析中...' : '🔍 画像からスタイルを分析 (AI)'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-800/50 border border-dashed border-gray-700 rounded text-xs text-gray-500">
              ヒント: 「モデル生成」タブで画像を選択すると、ここに取り込めます。
            </div>
          )}

          <p className="text-sm text-gray-400 mb-2">
             キャラクターの特徴プロンプト:
          </p>
          <textarea
            value={globalPrompt}
            onChange={(e) => setGlobalPrompt(e.target.value)}
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 resize-none mb-4"
          />

          <button
            onClick={handleGenerateAllRequired}
            disabled={!!batchProgress}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
               batchProgress 
               ? 'bg-gray-700 cursor-not-allowed' 
               : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
            }`}
          >
            {batchProgress ? (
               <>生成中 ({batchProgress.current}/{batchProgress.total})...</>
            ) : (
               <>🚀 全必須パーツを一括生成</>
            )}
          </button>
          
          {batchProgress && (
            <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
              <div 
                className="bg-violet-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              ></div>
            </div>
          )}

          <hr className="border-gray-800 my-6" />
          
          <button
             onClick={handleExportPSD}
             disabled={isExporting || layers.size === 0}
             className={`w-full py-3 rounded-lg font-semibold border border-gray-700 flex items-center justify-center gap-2 ${
                isExporting || layers.size === 0 ? 'text-gray-600 bg-gray-800/50' : 'text-gray-300 hover:bg-gray-800 hover:text-white bg-gray-800'
             }`}
          >
             {isExporting ? 'PSD作成中...' : '💾 PSD形式で保存 (実行)'}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
             生成されたパーツをレイヤー分けされた.psdファイルとしてダウンロードします。
          </p>

        </div>
      </div>

      {/* Right Panel: Layers List */}
      <div className="lg:col-span-8 flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
         <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-200">パーツレイヤー一覧</h3>
           <span className="text-xs text-gray-500">Generated: {layers.size} / {LAYER_DEFS.length}</span>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {LAYER_DEFS.map((layer) => {
               const isGenerated = layers.has(layer.id);
               const isGenerating = generating.has(layer.id);
               const generatedData = layers.get(layer.id);

               return (
                 <div key={layer.id} className={`flex items-center p-3 rounded-lg border transition-all ${
                    isGenerated ? 'bg-gray-800/80 border-violet-900/50' : 'bg-gray-800/30 border-gray-800'
                 }`}>
                    {/* Status Icon / Preview */}
                    <div 
                      className={`w-16 h-16 shrink-0 rounded bg-black/50 border border-gray-700 flex items-center justify-center overflow-hidden mr-4 relative ${isGenerated ? 'cursor-zoom-in hover:border-violet-500' : ''}`}
                      onClick={() => isGenerated && generatedData && setPreviewLayer(generatedData)}
                    >
                       {isGenerated && generatedData ? (
                          <img src={generatedData.url} className="w-full h-full object-contain" alt={layer.id} />
                       ) : isGenerating ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                       ) : (
                          <span className="text-gray-600 text-xs">Empty</span>
                       )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 mr-4">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${layer.required ? 'bg-red-900/50 text-red-200' : 'bg-gray-700 text-gray-400'}`}>
                             {layer.required ? 'REQUIRED' : 'OPTIONAL'}
                          </span>
                          <h4 className="font-medium text-gray-200 text-sm truncate">{layer.descriptionJa}</h4>
                       </div>
                       <p className="text-xs text-gray-500 truncate font-mono">{layer.id}</p>
                    </div>

                    {/* Action */}
                    <button
                       onClick={() => handleGenerateSingle(layer)}
                       disabled={isGenerating || !!batchProgress}
                       className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          isGenerated 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 border border-violet-600/30'
                       }`}
                    >
                       {isGenerated ? '再生成' : '生成'}
                    </button>
                 </div>
               );
            })}
         </div>
      </div>

      {/* Preview Modal */}
      {previewLayer && (
         <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="relative max-w-full max-h-full flex flex-col items-center">
               <button 
                 onClick={() => setPreviewLayer(null)}
                 className="absolute -top-12 right-0 text-gray-400 hover:text-white"
               >
                 ✕ 閉じる
               </button>
               <div className="bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')] bg-repeat rounded-lg border border-gray-700 overflow-hidden">
                  <img src={previewLayer.url} alt={previewLayer.id} className="max-h-[80vh] object-contain" />
               </div>
               <p className="mt-4 text-gray-300 font-mono text-sm bg-gray-800 px-3 py-1 rounded-full">
                  {previewLayer.id}
               </p>
            </div>
         </div>
      )}
    </div>
  );
};

export default LayerGenerator;
