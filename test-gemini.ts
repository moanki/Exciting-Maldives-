import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const engine = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function test() {
  const model = "gemini-3.1-pro-preview";
  const prompt = "Extract resort information from this PDF document.";
  const base64Data = Buffer.from("dummy pdf content").toString("base64");

  try {
    const response = await engine.models.generateContent({
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
        maxOutputTokens: 8192,
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
                  max_guests: { type: Type.STRING, description: "Maximum number of guests" },
                  size: { type: Type.STRING }
                }
              } 
            },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    console.log("Success");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

test();
