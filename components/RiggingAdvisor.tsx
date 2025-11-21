
import React, { useState, useRef } from 'react';
import { 
  detectMainCharacter, 
  analyzeCharacterDescription, 
  generateMasterCharacter, 
  generatePartLayer, 
  analyzeRiggingRequirements,
  PartType
} from '../services/geminiService';
import { GeneratedImage, RiggingAnalysis, RiggingStep } from '../types';
import { writePsd } from 'ag-psd';

interface RiggingAdvisorProps {
  selectedImage: GeneratedImage | null;
}

// Improved chroma key with tolerance
const makeTransparent = (canvas: HTMLCanvasElement, tolerance = 20) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Target color is White (255, 255, 255)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate distance from white
    const dist = Math.sqrt(
      Math.pow(255 - r, 2) + 
      Math.pow(255 - g, 2) + 
      Math.pow(255 - b, 2)
    );

    if (dist < tolerance) {
      data[i + 3] = 0; // Full transparent
    } else if (dist < tolerance + 20) {
      // Smooth edge (anti-aliasingish)
      data[i + 3] = Math.floor((dist - tolerance) / 20 * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

const RiggingAdvisor: React.FC<RiggingAdvisorProps> = ({ selectedImage }) => {
  const [step, setStep] = useState<RiggingStep>(RiggingStep.IDLE);
  const [statusMsg, setStatusMsg] = useState<string>("");
  
  // Images state
  const [localImage, setLocalImage] = useState<GeneratedImage | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [masterChar, setMasterChar] = useState<{ base64: string, url: string } | null>(null);
  
  const [analysis, setAnalysis] = useState<RiggingAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImage = selectedImage || localImage;

  const resetState = () => {
    setStep(RiggingStep.IDLE);
    setCroppedUrl(null);
    setMasterChar(null);
    setAnalysis(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalImage({
        id: 'local-rig',
        url: reader.result as string,
        prompt: 'Uploaded',
        base64: (reader.result as string).split(',')[1],
        mimeType: file.type
      });
      resetState();
    };
    reader.readAsDataURL(file);
  };

  // STEP 1 & 2: Detect and Crop
  const handleExtract = async () => {
    if (!activeImage || !activeImage.base64) return;
    
    setStep(RiggingStep.DETECTING);
    setStatusMsg("画像を分析し、主要キャラクター（正面）を特定しています...");
    
    try {
      const box = await detectMainCharacter(activeImage.base64, activeImage.mimeType || 'image/png');
      
      setStep(RiggingStep.CROPPING);
      const img = new Image();
      img.src = activeImage.url;
      await new Promise(r => img.onload = r);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas error");
      
      let [ymin, xmin, ymax, xmax] = box;
      // Add 10% padding
      const padX = (xmax - xmin) * 0.1;
      const padY = (ymax - ymin) * 0.1;
      ymin = Math.max(0, ymin - padY);
      xmin = Math.max(0, xmin - padX);
      ymax = Math.min(1000, ymax + padY);
      xmax = Math.min(1000, xmax + padX);

      const x = (xmin / 1000) * img.width;
      const y = (ymin / 1000) * img.height;
      const w = ((xmax - xmin) / 1000) * img.width;
      const h = ((ymax - ymin) / 1000) * img.height;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      
      const newUrl = canvas.toDataURL('image/png');
      setCroppedUrl(newUrl);
      
      // Automatically proceed to refinement
      handleRefine(newUrl);

    } catch (e) {
      console.error(e);
      alert("キャラクター検出に失敗しました");
      setStep(RiggingStep.IDLE);
    }
  };

  // STEP 3: Refine to Master Image
  const handleRefine = async (cropUrl: string) => {
    setStep(RiggingStep.REFINING);
    setStatusMsg("三面図やノイズを除去し、クリーンな立ち絵を生成しています...");
    
    try {
      const cropBase64 = cropUrl.split(',')[1];
      
      // 1. Get strict description
      const description = await analyzeCharacterDescription(cropBase64, 'image/png');
      
      // 2. Generate clean master
      const masterRes = await generateMasterCharacter(description);
      const masterUrl = `data:${masterRes.mimeType};base64,${masterRes.base64}`;
      
      setMasterChar({
        base64: masterRes.base64,
        url: masterUrl
      });
      
      // 3. Analyze this clean image for cutting advice AND Face location
      const advice = await analyzeRiggingRequirements(masterRes.base64, masterRes.mimeType);
      setAnalysis(advice);

      setStep(RiggingStep.IDLE); // Ready for next user action
      setStatusMsg("クリーンな立ち絵の生成が完了しました。");

    } catch (e) {
      console.error(e);
      alert("正規化に失敗しました");
      setStep(RiggingStep.IDLE);
    }
  };

  // STEP 4 & 5: Generate Parts & PSD
  const handleGenerateParts = async () => {
    if (!masterChar || !analysis) return;

    setStep(RiggingStep.GENERATING_PARTS);
    setStatusMsg("パーツ（素体、後ろ髪、前髪、目、口）を生成・分割しています...");

    try {
      const description = await analyzeCharacterDescription(masterChar.base64, 'image/png');

      // Generate 5 layers
      const [backHairRes, bodySkinRes, frontHairRes, eyesRes, mouthRes] = await Promise.all([
        generatePartLayer(description, 'back_hair'),
        generatePartLayer(description, 'body_skin'),
        generatePartLayer(description, 'front_hair'),
        generatePartLayer(description, 'eyes'),
        generatePartLayer(description, 'mouth'),
      ]);

      setStep(RiggingStep.ASSEMBLING);
      setStatusMsg("PSDを構成中（座標計算・配置・透過処理）...");

      const loadImage = (b64: string) => {
        return new Promise<HTMLCanvasElement>((resolve) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(c);
          };
        });
      };

      // Load all canvases
      const masterCanvas = await loadImage(masterChar.base64);
      const backHairCanvas = await loadImage(backHairRes.base64);
      const bodyCanvas = await loadImage(bodySkinRes.base64);
      const frontHairCanvas = await loadImage(frontHairRes.base64);
      const eyesCanvas = await loadImage(eyesRes.base64);
      const mouthCanvas = await loadImage(mouthRes.base64);

      // Apply Chroma Key (Transparency)
      // Use higher tolerance for hair which might have shadows
      makeTransparent(backHairCanvas, 30);
      makeTransparent(bodyCanvas, 15);
      makeTransparent(frontHairCanvas, 30);
      makeTransparent(eyesCanvas, 15);
      makeTransparent(mouthCanvas, 15);

      // --- Calculate Placement ---
      // Get Face Box from Analysis (0-1000 scale)
      // Default fallback if AI didn't return good box
      const box = analysis.faceBoundingBox || [100, 300, 300, 700]; // [ymin, xmin, ymax, xmax]
      const [fYmin, fXmin, fYmax, fXmax] = box;
      
      const masterW = masterCanvas.width;
      const masterH = masterCanvas.height;

      // Convert 0-1000 to pixels
      const faceX = (fXmin / 1000) * masterW;
      const faceY = (fYmin / 1000) * masterH;
      const faceW = ((fXmax - fXmin) / 1000) * masterW;
      const faceH = ((fYmax - fYmin) / 1000) * masterH;
      
      // Helper to resize canvas
      const resizeCanvas = (canvas: HTMLCanvasElement, targetW: number, targetH: number) => {
         const temp = document.createElement('canvas');
         temp.width = targetW;
         temp.height = targetH;
         const tCtx = temp.getContext('2d');
         tCtx?.drawImage(canvas, 0, 0, targetW, targetH);
         return temp;
      };

      // 1. Eyes: Position at roughly top 1/3 of face height
      // Scale eyes to be roughly 80% of face width
      const eyesW = faceW * 0.8;
      const eyesH = eyesW * (eyesCanvas.height / eyesCanvas.width); // maintain aspect
      const finalEyes = resizeCanvas(eyesCanvas, eyesW, eyesH);
      const eyesLeft = faceX + (faceW - eyesW) / 2;
      const eyesTop = faceY + (faceH * 0.35) - (eyesH / 2);

      // 2. Mouth: Position at roughly bottom 1/4 of face height
      const mouthW = faceW * 0.3;
      const mouthH = mouthW * (mouthCanvas.height / mouthCanvas.width);
      const finalMouth = resizeCanvas(mouthCanvas, mouthW, mouthH);
      const mouthLeft = faceX + (faceW - mouthW) / 2;
      const mouthTop = faceY + (faceH * 0.75) - (mouthH / 2);

      // 3. Front Hair: Needs to cover forehead.
      // Scale to Face Width * 1.2 usually
      const hairW = faceW * 1.3;
      const hairH = hairW * (frontHairCanvas.height / frontHairCanvas.width);
      const finalFrontHair = resizeCanvas(frontHairCanvas, hairW, hairH);
      const hairLeft = faceX + (faceW - hairW) / 2;
      const hairTop = faceY - (hairH * 0.2); // Start slightly above face

      // 4. Body & Back Hair: Assume they fit the canvas 3:4 ratio roughly like the master
      // No resizing needed for body if generated with same aspect ratio prompt
      
      const psdChildren = [
        {
          name: "Original Ref (Reference)",
          canvas: masterCanvas,
          hidden: true,
          opacity: 0.4
        },
        {
          name: "Back Hair (後ろ髪)",
          canvas: backHairCanvas,
          top: 0, left: 0
        },
        {
          name: "Body & Head (素体)",
          canvas: bodyCanvas,
          top: 0, left: 0
        },
        {
          name: "Mouth (口)",
          canvas: finalMouth,
          top: mouthTop, left: mouthLeft
        },
        {
          name: "Eyes (目)",
          canvas: finalEyes,
          top: eyesTop, left: eyesLeft
        },
        {
          name: "Front Hair (前髪)",
          canvas: finalFrontHair,
          top: hairTop, left: hairLeft
        }
      ];

      const psd = {
        width: masterCanvas.width,
        height: masterCanvas.height,
        children: psdChildren
      };

      const buffer = writePsd(psd as any);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Live2D_Model_${Date.now()}.psd`;
      link.click();

      setStep(RiggingStep.COMPLETED);
      setStatusMsg("生成完了！");

    } catch (e) {
      console.error(e);
      alert("パーツ生成に失敗しました");
      setStep(RiggingStep.IDLE);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* LEFT: Controls & Process View */}
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-violet-400">3.</span> リギング・スタジオ
          </h2>
          
          {/* STEP 1: Input */}
          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-300 mb-2">1. 元画像（三面図可）</label>
             {!activeImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-800 transition-colors"
                >
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*"/>
                   <div className="text-4xl mb-2">📂</div>
                   <p className="text-sm text-gray-400">ここをクリックして画像をアップロード</p>
                </div>
             ) : (
               <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg">
                 <img src={activeImage.url} className="w-16 h-16 object-cover rounded bg-white" alt="Input" />
                 <div className="flex-1 min-w-0">
                   <p className="text-sm text-white truncate">元の画像</p>
                   <p className="text-xs text-gray-400 truncate">ここから正面立ち絵を検出します</p>
                 </div>
                 <button onClick={() => { setLocalImage(null); resetState(); }} className="text-gray-400 hover:text-white text-xs bg-gray-700 px-2 py-1 rounded">変更</button>
               </div>
             )}
          </div>

          {/* STEP 2: Process Buttons */}
          <div className="space-y-4">
            {/* Detect & Refine */}
            {!masterChar && (
              <button
                onClick={handleExtract}
                disabled={!activeImage || step !== RiggingStep.IDLE}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                   !activeImage || step !== RiggingStep.IDLE ? 'bg-gray-800 text-gray-500' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20'
                }`}
              >
                {step === RiggingStep.DETECTING || step === RiggingStep.REFINING ? (
                   <><span className="animate-spin">⚙️</span> {statusMsg}</>
                ) : (
                   <>🔍 正面の立ち絵を検出＆正規化</>
                )}
              </button>
            )}

            {/* Parts Generation */}
            {masterChar && (
              <button
                onClick={handleGenerateParts}
                disabled={step !== RiggingStep.IDLE && step !== RiggingStep.COMPLETED}
                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                   step !== RiggingStep.IDLE && step !== RiggingStep.COMPLETED ? 'bg-gray-700 text-gray-400' : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg hover:scale-[1.02]'
                }`}
              >
                {step === RiggingStep.GENERATING_PARTS || step === RiggingStep.ASSEMBLING ? (
                   <><span className="animate-spin">⚙️</span> {statusMsg}</>
                ) : (
                   <>✨ パーツ分割(5層)＆PSDダウンロード</>
                )}
              </button>
            )}
          </div>
          
          {step === RiggingStep.COMPLETED && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded text-center text-green-400 text-sm">
               PSDの保存が完了しました！Live2D Editorで開いて確認してください。
               <br/>
               <span className="text-xs text-gray-400">※ レイヤー: 後ろ髪 / 素体 / 口 / 目 / 前髪</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Visualization Area */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
           <h3 className="font-semibold text-gray-200">プレビュー</h3>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gray-950/50 flex flex-col items-center gap-6">
           
           {/* 1. Cropped Raw View */}
           {croppedUrl && !masterChar && (
             <div className="w-full max-w-[300px]">
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold">検出エリア（Raw）</p>
                <img src={croppedUrl} className="w-full rounded border border-gray-700 opacity-80" alt="Cropped" />
             </div>
           )}

           {/* 2. Refined Master View */}
           {masterChar && (
             <div className="w-full max-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs text-violet-400 uppercase font-bold">マスター立ち絵（正規化済）</p>
                  <span className="text-[10px] bg-violet-900 text-violet-200 px-2 py-0.5 rounded">Base Image</span>
                </div>
                <div className="relative group">
                   <img src={masterChar.url} className="w-full rounded shadow-2xl shadow-violet-900/20 border border-violet-500/30" alt="Master" />
                   
                   {/* Overlay Face Box if available */}
                   {analysis?.faceBoundingBox && (
                      <div 
                        className="absolute border-2 border-yellow-400/70 bg-yellow-400/10 z-10"
                        style={{
                           top: `${analysis.faceBoundingBox[0]/10}%`,
                           left: `${analysis.faceBoundingBox[1]/10}%`,
                           height: `${(analysis.faceBoundingBox[2] - analysis.faceBoundingBox[0])/10}%`,
                           width: `${(analysis.faceBoundingBox[3] - analysis.faceBoundingBox[1])/10}%`,
                        }}
                      >
                         <span className="absolute -top-4 left-0 text-[10px] bg-yellow-500 text-black px-1 font-bold">Face</span>
                      </div>
                   )}

                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-xs text-white">黄色い枠は検出された顔エリアです。ここに目・口・前髪を配置します。</p>
                   </div>
                </div>
             </div>
           )}

           {!croppedUrl && !masterChar && (
             <div className="text-center text-gray-600 mt-20">
               <div className="text-4xl mb-2">🖼️</div>
               <p>画像をセットしてプロセスを開始してください</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default RiggingAdvisor;
