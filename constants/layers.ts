
import { LayerDefinition } from '../types';

export const LAYER_DEFS: LayerDefinition[] = [
  // --- Body Group ---
  {
    id: "Body/BodyBase",
    required: true,
    zOrder: 10,
    descriptionJa: "身体の素体（首から下）",
    aiPrompt: "anime character body base, neck and shoulders and torso, no head, no face, no hair, standing pose, simple skin coloring, asset only, floating, transparent background",
    aiNegativePrompt: "head, face, hair, eyes, mouth, background"
  },
  {
    id: "Body/Clothes_Main",
    required: true,
    zOrder: 20,
    descriptionJa: "メインの衣装（トップス・ボトムス）",
    aiPrompt: "anime character clothing outfit, shirt or dress, no body skin, no head, no limbs, cloth texture only, floating, transparent background",
    aiNegativePrompt: "skin, face, head, hands, legs, background"
  },
  {
    id: "Body/Clothes_Over",
    required: false,
    zOrder: 25,
    descriptionJa: "上着・コート（オプション）",
    aiPrompt: "anime character coat or jacket or cape, outer wear, floating, no body, no head, transparent background",
    aiNegativePrompt: "skin, face, head, inner clothes, background"
  },
  {
    id: "Body/Neck_Shadow",
    required: true,
    zOrder: 15,
    descriptionJa: "首の落ち影",
    aiPrompt: "shadow shape for anime neck, dark semi-transparent gradient, small asset, floating, transparent background",
    aiNegativePrompt: "face, body, bright colors"
  },

  // --- Hair Back ---
  {
    id: "Hair_Back/Hair_Back",
    required: true,
    zOrder: 5,
    descriptionJa: "後ろ髪全体",
    aiPrompt: "anime back hair texture, long hair flowing behind, no face, no body, hair strands only, asset, floating, transparent background",
    aiNegativePrompt: "face, eyes, mouth, body, front hair, background"
  },

  // --- Head Base ---
  {
    id: "HeadBase/HeadBase",
    required: true,
    zOrder: 30,
    descriptionJa: "顔の輪郭（のっぺらぼう）",
    aiPrompt: "anime head shape, face outline, skin texture, faceless, no eyes, no mouth, no nose, no hair, bald head, asset only, floating, transparent background",
    aiNegativePrompt: "eyes, mouth, nose, hair, eyebrows, body, background"
  },
  {
    id: "HeadBase/Face_Shadow",
    required: false,
    zOrder: 31,
    descriptionJa: "顔の陰影",
    aiPrompt: "anime face shading layer, soft shadow gradient for forehead and cheeks, semi-transparent, asset only, transparent background",
    aiNegativePrompt: "eyes, mouth, nose, sharp lines"
  },
  {
    id: "HeadBase/Face_Blush",
    required: false,
    zOrder: 32,
    descriptionJa: "赤面・チーク",
    aiPrompt: "anime blush cheeks effect, pink soft gradient, floating, transparent background",
    aiNegativePrompt: "face features, solid lines"
  },

  // --- Eyes (Left) ---
  {
    id: "Eye_L/EyeL_White",
    required: true,
    zOrder: 40,
    descriptionJa: "左目：白目",
    aiPrompt: "single anime eye sclera (white part), left eye, simple white shape, no iris, no lash, asset only, transparent background",
    aiNegativePrompt: "iris, pupil, eyelash, skin, face"
  },
  {
    id: "Eye_L/EyeL_Iris",
    required: true,
    zOrder: 42,
    descriptionJa: "左目：虹彩",
    aiPrompt: "single anime eye iris and pupil, left eye, high detail, vibrant color, round shape, floating, no white part, no eyelashes, asset only, transparent background",
    aiNegativePrompt: "sclera, white part, skin, face, eyelash"
  },
  {
    id: "Eye_L/EyeL_Highlight",
    required: true,
    zOrder: 44,
    descriptionJa: "左目：ハイライト",
    aiPrompt: "anime eye highlight reflection, white sparkles, tiny asset, floating, transparent background",
    aiNegativePrompt: "iris, black color"
  },
  {
    id: "Eye_L/EyeL_Line",
    required: true,
    zOrder: 45,
    descriptionJa: "左目：まつ毛・アイライン",
    aiPrompt: "single anime eye eyelashes, upper and lower lash line, left eye, black ink style, thick line, no eye ball, asset only, transparent background",
    aiNegativePrompt: "iris, sclera, skin, face"
  },
  {
    id: "Eye_L/EyeL_Shadow",
    required: false,
    zOrder: 43,
    descriptionJa: "左目：落ち影",
    aiPrompt: "shadow for upper eyelid on eye, crescent shape, dark semi-transparent, asset only, transparent background",
    aiNegativePrompt: "iris, skin"
  },

  // --- Eyes (Right) ---
  {
    id: "Eye_R/EyeR_White",
    required: true,
    zOrder: 40,
    descriptionJa: "右目：白目",
    aiPrompt: "single anime eye sclera (white part), right eye, simple white shape, no iris, no lash, asset only, transparent background",
    aiNegativePrompt: "iris, pupil, eyelash, skin, face"
  },
  {
    id: "Eye_R/EyeR_Iris",
    required: true,
    zOrder: 42,
    descriptionJa: "右目：虹彩",
    aiPrompt: "single anime eye iris and pupil, right eye, high detail, vibrant color, round shape, floating, no white part, no eyelashes, asset only, transparent background",
    aiNegativePrompt: "sclera, white part, skin, face, eyelash"
  },
  {
    id: "Eye_R/EyeR_Highlight",
    required: true,
    zOrder: 44,
    descriptionJa: "右目：ハイライト",
    aiPrompt: "anime eye highlight reflection, white sparkles, tiny asset, floating, transparent background",
    aiNegativePrompt: "iris, black color"
  },
  {
    id: "Eye_R/EyeR_Line",
    required: true,
    zOrder: 45,
    descriptionJa: "右目：まつ毛・アイライン",
    aiPrompt: "single anime eye eyelashes, upper and lower lash line, right eye, black ink style, thick line, no eye ball, asset only, transparent background",
    aiNegativePrompt: "iris, sclera, skin, face"
  },
  {
    id: "Eye_R/EyeR_Shadow",
    required: false,
    zOrder: 43,
    descriptionJa: "右目：落ち影",
    aiPrompt: "shadow for upper eyelid on eye, crescent shape, dark semi-transparent, asset only, transparent background",
    aiNegativePrompt: "iris, skin"
  },

  // --- Eyebrows ---
  {
    id: "Eyebrow/Brow_L",
    required: true,
    zOrder: 50,
    descriptionJa: "左眉",
    aiPrompt: "single anime eyebrow, left side, line art, expression component, asset only, floating, transparent background",
    aiNegativePrompt: "eye, face, skin, hair"
  },
  {
    id: "Eyebrow/Brow_R",
    required: true,
    zOrder: 50,
    descriptionJa: "右眉",
    aiPrompt: "single anime eyebrow, right side, line art, expression component, asset only, floating, transparent background",
    aiNegativePrompt: "eye, face, skin, hair"
  },

  // --- Mouth ---
  {
    id: "Mouth/Mouth_Close",
    required: false,
    zOrder: 35,
    descriptionJa: "口（閉じ線）",
    aiPrompt: "anime mouth line, closed mouth, neutral expression, line only, floating, transparent background",
    aiNegativePrompt: "face, teeth, tongue, skin"
  },
  {
    id: "Mouth/Mouth_A",
    required: true,
    zOrder: 35,
    descriptionJa: "口（あ・開き）",
    aiPrompt: "anime open mouth shape, 'A' vowel, lip outline only, no inside color, asset only, floating, transparent background",
    aiNegativePrompt: "face, skin, nose"
  },
  {
    id: "Mouth/Mouth_Teeth",
    required: true,
    zOrder: 34,
    descriptionJa: "上の歯",
    aiPrompt: "anime upper teeth row, white shape, small asset, floating, transparent background",
    aiNegativePrompt: "lips, tongue, face"
  },
  {
    id: "Mouth/Mouth_Tongue",
    required: true,
    zOrder: 33,
    descriptionJa: "舌・口内",
    aiPrompt: "anime tongue and mouth inside, pink and dark red, round shape, asset only, floating, transparent background",
    aiNegativePrompt: "lips, teeth, face"
  },

  // --- Hair Side/Front ---
  {
    id: "Hair_Side/Hair_Side_L",
    required: true,
    zOrder: 60,
    descriptionJa: "横髪（左）",
    aiPrompt: "anime side hair lock, left side, hair strand texture, long, floating, no face, asset only, transparent background",
    aiNegativePrompt: "face, body, eyes"
  },
  {
    id: "Hair_Side/Hair_Side_R",
    required: true,
    zOrder: 60,
    descriptionJa: "横髪（右）",
    aiPrompt: "anime side hair lock, right side, hair strand texture, long, floating, no face, asset only, transparent background",
    aiNegativePrompt: "face, body, eyes"
  },
  {
    id: "Hair_Front/Hair_Front_Main",
    required: true,
    zOrder: 70,
    descriptionJa: "前髪メイン",
    aiPrompt: "anime front bangs, main forehead hair, detailed hair texture, floating, no face, no eyes, asset only, transparent background",
    aiNegativePrompt: "face, eyes, skin, body"
  },
  {
    id: "Hair_Front/Ahoge",
    required: false,
    zOrder: 75,
    descriptionJa: "アホ毛",
    aiPrompt: "anime ahoge, single hair strand sticking up, cowlick, floating, asset only, transparent background",
    aiNegativePrompt: "head, face, body"
  },

  // --- Accessory ---
  {
    id: "Accessory/Accessory_Head_L",
    required: false,
    zOrder: 80,
    descriptionJa: "頭飾り（左）",
    aiPrompt: "anime hair accessory, ribbon or pin, left side, detailed, floating, asset only, transparent background",
    aiNegativePrompt: "hair, face, head"
  }
];
