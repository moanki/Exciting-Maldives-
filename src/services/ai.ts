import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const extractResortDataFromPDF = async (base64Data: string) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Extract resort information from this PDF document. 
    Return a JSON object with the following fields:
    - name: string
    - location: string
    - atoll: string
    - description: string (detailed, luxury tone)
    - category: string (e.g., Ultra-Luxury, Luxury, Premium)
    - transfer_type: string (e.g., Seaplane, Speedboat)
    - meal_plans: string[]
    - room_types: object[] (name, description, max_guests, size)
    - highlights: string[] (key selling points)
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
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
                max_guests: { type: Type.INTEGER },
                size: { type: Type.STRING }
              }
            } 
          },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateResortDescription = async (resortName: string, features: string[]) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Write a luxury, evocative description for a Maldives resort named "${resortName}" with these features: ${features.join(', ')}. Focus on the sensory experience, privacy, and the beauty of the Indian Ocean.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};
