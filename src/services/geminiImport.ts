
import { GoogleGenAI, Type } from "@google/genai";

const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview"
];

export interface ResortExtractionResult {
  name: string;
  location: string;
  atoll: string;
  description: string;
  category: string;
  transfer_type: string;
  meal_plans: string[];
  room_types: {
    name: string;
    description: string;
    max_guests: string;
    size: string;
  }[];
  highlights: string[];
  seo_summary: string;
}

export async function extractResortInfoFromPDF(
  base64Data: string, 
  onModelSwitch?: (model: string) => void
): Promise<ResortExtractionResult> {
  // Use the parameters as instructed by the skill
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

  const prompt = `
    Extract resort information from this PDF document of its factsheet. 
    Be extremely accurate and detailed.
    Return a JSON object with the following fields:
    - name: string (The official name of the resort)
    - location: string (General location details)
    - atoll: string (Specifically identify which Maldivian atoll)
    - description: string (A rich, engaging description)
    - category: string (5-star, 4-star, etc)
    - transfer_type: string (Seaplane, Speedboat, etc)
    - meal_plans: string[] (List of plans like All Inclusive, Half Board)
    - room_types: array of objects (name, description, max_guests, size)
    - highlights: string[] (Key features or USPs)
    - seo_summary: string (An SEO optimized summary of the resort and its rooms, at least 2 paragraphs)
  `;

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      if (onModelSwitch) onModelSwitch(modelName);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              atoll: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              transfer_type: { type: Type.STRING },
              meal_plans: { type: Type.ARRAY, items: { type: Type.STRING } },
              room_types: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    max_guests: { type: Type.STRING },
                    size: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              seo_summary: { type: Type.STRING }
            },
            required: ["name", "location", "atoll", "description", "seo_summary"]
          },
        },
      });

      const extractedData = JSON.parse(response.text || '{}');
      return extractedData as ResortExtractionResult;

    } catch (err: any) {
      console.warn(`Model ${modelName} failed or exhausted:`, err.message);
      lastError = err;
      
      // If it's a quota issue, we try the next model
      if (err.message?.toLowerCase().includes('429') || 
          err.message?.toLowerCase().includes('quota') ||
          err.message?.toLowerCase().includes('rate limit')) {
        continue; 
      }
      
      // For other errors, we still try the next model just in case, or maybe it's a specific model error
      continue;
    }
  }

  // If we reach here, all models failed
  if (lastError?.message?.toLowerCase().includes('429') || 
      lastError?.message?.toLowerCase().includes('quota')) {
    throw new Error('AI_TOKENS_EXHAUSTED');
  }
  
  throw new Error(lastError?.message || 'Failed to extract data from PDF');
}
