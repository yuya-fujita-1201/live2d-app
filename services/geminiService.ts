
import { GoogleGenAI, Type } from "@google/genai";
import { AIStudioClient, BoundingBox, LayerDefinition, RiggingAnalysis } from "../types";

// Helper to ensure we have the client with the latest key
const getAIClient = async () => {
  const aistudio = (window as any).aistudio as AIStudioClient | undefined;
  if (aistudio) {
     const hasKey = await aistudio.hasSelectedApiKey();
     if (!hasKey) {
         throw new Error("API Key not selected");
     }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCharacterImage = async (prompt: string): Promise<{ base64: string; mimeType: string }> => {
  const ai = await getAIClient();
  
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '3:4',
    },
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image || !image.imageBytes) {
    throw new Error("Failed to generate image");
  }

  return {
    base64: image.imageBytes,
    mimeType: 'image/png'
  };
};

export const animateCharacterVideo = async (
  imageBase64: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  const ai = await getAIClient();

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: imageBase64,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed or no URI returned.");
  }

  const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
};

// --- Layer Generation for Live2D ---

export const generateLayerImage = async (
  layer: LayerDefinition,
  globalStylePrompt: string
): Promise<Blob> => {
  const ai = await getAIClient();

  // Construct a strict prompt to force isolation of the part
  // We combine the global style with the specific layer prompt and negative constraints
  const fullPrompt = `
    (Vector Asset:1.5), (White Background:1.5),
    Style: ${globalStylePrompt}.
    Subject: ${layer.aiPrompt}.
    Ensure this is an isolated element.
    ${layer.aiNegativePrompt ? `Exclude: ${layer.aiNegativePrompt}.` : ''}
    Clean lines, high quality, anime production material.
  `.trim().replace(/\s+/g, ' ');

  // We use a 1:1 ratio for most parts to ensure they fit in a texture atlas, 
  // but for bodies we might want taller. For simplicity, 1:1 is safest for 'assets'.
  const aspectRatio = layer.id.startsWith('Body') ? '3:4' : '1:1';

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio,
    },
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image || !image.imageBytes) {
    throw new Error(`Failed to generate layer: ${layer.id}`);
  }

  // Convert Base64 string to Blob
  const byteCharacters = atob(image.imageBytes);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/png' });
};

// --- Rigging Advisor Service Methods ---

export type PartType = 'back_hair' | 'body_skin' | 'front_hair' | 'eyes' | 'mouth';

export const detectMainCharacter = async (base64: string, mimeType: string): Promise<BoundingBox> => {
  const ai = await getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: "Return the bounding box of the main character's full body in the image. Return as a JSON array of integers: [ymin, xmin, ymax, xmax] on a 0-1000 scale." }
      ]
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER }
        }
    }
  });
  
  const json = JSON.parse(response.text || "[]");
  // Fallback or validation
  if (!Array.isArray(json) || json.length < 4) {
      return [0, 0, 1000, 1000];
  }
  return json as BoundingBox;
};

export const analyzeCharacterDescription = async (base64: string, mimeType: string): Promise<string> => {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType } },
                { text: "Describe this character in detail for the purpose of regenerating a high-quality production asset. Include hair color, style, eye color, clothing details, and expression. Output a single paragraph or comma-separated list." }
            ]
        }
    });
    return response.text || "Anime character";
};

export const generateMasterCharacter = async (description: string): Promise<{ base64: string; mimeType: string }> => {
    const ai = await getAIClient();
    // Clean master generation
    const prompt = `(Masterpiece), (Best Quality), (Vector Art), (White Background), (Front View), ${description}, full body standing, neutral pose, flat coloring, anime style.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '3:4',
        },
    });

    const image = response.generatedImages?.[0]?.image;
    if (!image || !image.imageBytes) {
        throw new Error("Failed to generate master character");
    }

    return {
        base64: image.imageBytes,
        mimeType: 'image/png'
    };
};

export const generatePartLayer = async (description: string, partType: PartType): Promise<{ base64: string; mimeType: string }> => {
    const ai = await getAIClient();
    let specificPrompt = "";
    let negativePrompt = "";
    let aspectRatio = "1:1";

    switch(partType) {
        case 'back_hair':
            specificPrompt = "Back hair only. Hair flowing behind the head. No face, no body.";
            negativePrompt = "face, eyes, mouth, skin, front hair, body";
            aspectRatio = "3:4";
            break;
        case 'body_skin':
            specificPrompt = "Body base (skin) and clothes only. Head shape but faceless (no eyes, no mouth, no hair). Neck, shoulders, torso.";
            negativePrompt = "eyes, mouth, nose, hair, eyebrows";
            aspectRatio = "3:4";
            break;
        case 'front_hair':
            specificPrompt = "Front hair (bangs) only. Floating hair texture. No face, no eyes.";
            negativePrompt = "face, eyes, mouth, skin, back hair, body";
            break;
        case 'eyes':
            specificPrompt = "Anime eyes pair (left and right). High detail, beautiful eyes. Floating. No face skin.";
            negativePrompt = "nose, mouth, face skin, hair, eyebrows";
            break;
        case 'mouth':
            specificPrompt = "Anime mouth (lips and open mouth). Floating. No face skin.";
            negativePrompt = "eyes, nose, face skin, hair";
            break;
    }

    const prompt = `(Vector Asset), (White Background), (Isolated), ${specificPrompt}. Style based on: ${description}. ${negativePrompt ? `Exclude: ${negativePrompt}.` : ''}`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
        },
    });

    const image = response.generatedImages?.[0]?.image;
    if (!image || !image.imageBytes) {
        throw new Error(`Failed to generate part: ${partType}`);
    }

    return {
        base64: image.imageBytes,
        mimeType: 'image/png'
    };
};

export const analyzeRiggingRequirements = async (base64: string, mimeType: string): Promise<RiggingAnalysis> => {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType } },
                { text: "Analyze this character image. 1. Return the bounding box of the face area (from top of forehead to chin, ear to ear). 2. Provide short rigging recommendations." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    faceBoundingBox: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: "[ymin, xmin, ymax, xmax] on 0-1000 scale"
                    },
                    recommendations: { type: Type.STRING }
                },
                required: ["faceBoundingBox", "recommendations"]
            }
        }
    });
    
    const json = JSON.parse(response.text || "{}");
    return {
        faceBoundingBox: json.faceBoundingBox || [100, 300, 300, 700],
        recommendations: json.recommendations || "No specific recommendations."
    };
};
