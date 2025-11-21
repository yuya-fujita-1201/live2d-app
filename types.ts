
export enum AppMode {
  GENERATE = 'GENERATE',
  ANIMATE = 'ANIMATE',
  LAYER_GEN = 'LAYER_GEN' // Renamed from ANALYZE
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  base64?: string; 
  mimeType?: string;
}

export interface AIStudioClient {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// --- Rigging / Advisor Types ---

export type BoundingBox = [number, number, number, number]; // ymin, xmin, ymax, xmax

export interface RiggingAnalysis {
  faceBoundingBox: BoundingBox;
  recommendations: string;
}

export enum RiggingStep {
  IDLE = 'IDLE',
  DETECTING = 'DETECTING',
  CROPPING = 'CROPPING',
  REFINING = 'REFINING',
  GENERATING_PARTS = 'GENERATING_PARTS',
  ASSEMBLING = 'ASSEMBLING',
  COMPLETED = 'COMPLETED'
}

// --- Live2D Specific Types ---

export type LayerId =
  // Body
  | "Body/BodyBase"
  | "Body/Clothes_Main"
  | "Body/Clothes_Over"
  | "Body/Neck_Shadow"
  // HeadBase
  | "HeadBase/HeadBase"
  | "HeadBase/Face_Shadow"
  | "HeadBase/Face_Blush"
  // Eyebrow
  | "Eyebrow/Brow_L"
  | "Eyebrow/Brow_R"
  // Eye_L
  | "Eye_L/EyeL_White"
  | "Eye_L/EyeL_Iris"
  | "Eye_L/EyeL_Highlight"
  | "Eye_L/EyeL_Line"
  | "Eye_L/EyeL_Shadow"
  // Eye_R
  | "Eye_R/EyeR_White"
  | "Eye_R/EyeR_Iris"
  | "Eye_R/EyeR_Highlight"
  | "Eye_R/EyeR_Line"
  | "Eye_R/EyeR_Shadow"
  // Mouth
  | "Mouth/Mouth_Close"
  | "Mouth/Mouth_A"
  | "Mouth/Mouth_I"
  | "Mouth/Mouth_U"
  | "Mouth/Mouth_Teeth"
  | "Mouth/Mouth_Tongue"
  // Hair_Back
  | "Hair_Back/Hair_Back"
  // Hair_Side
  | "Hair_Side/Hair_Side_L"
  | "Hair_Side/Hair_Side_R"
  // Hair_Front
  | "Hair_Front/Hair_Front_Main"
  | "Hair_Front/Hair_Front_Sub"
  | "Hair_Front/Ahoge"
  // Accessory
  | "Accessory/Accessory_Head_L"
  | "Accessory/Accessory_Head_R";

export interface LayerDefinition {
  id: LayerId;
  required: boolean;
  zOrder: number;
  descriptionJa: string;
  aiPrompt: string; // Base prompt for the part
  aiNegativePrompt?: string; // Instructions to exclude things
}

export interface GeneratedLayer {
  id: LayerId;
  blob: Blob;
  url: string; // For preview
}