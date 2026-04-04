/**
 * Content Processing Service
 * 
 * This service handles advanced content extraction and generation tasks.
 * It uses a secure backend processing engine to analyze documents and generate
 * descriptive content for resorts.
 */

import { GoogleGenAI, Type } from "@google/genai";

// Initialize the processing engine with the secure API key
const engine = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Extracts structured resort data from a PDF document.
 * 
 * @param base64Data - The base64 encoded PDF data.
 * @returns A structured object containing resort information.
 * @throws Error if the extraction fails or the engine is unavailable.
 */
export const extractResortDataFromPDF = async (base64Data: string) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Extract resort information from this PDF document. 
    Return a JSON object with the following fields. IMPORTANT: Keep all descriptions concise to prevent output truncation.
    - name: string
    - location: string
    - atoll: string
    - description: string (luxury tone, maximum 3 sentences)
    - category: string (e.g., Ultra-Luxury, Luxury, Premium)
    - transfer_type: string (e.g., Seaplane, Speedboat)
    - meal_plans: string[] (maximum 5 items)
    - room_types: object[] (name, description (maximum 1 sentence), max_guests, size. Maximum 10 room types total)
    - highlights: string[] (key selling points, maximum 8 items)
  `;

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
        maxOutputTokens: 8192, // Increased limit to prevent truncation for large PDFs
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

    if (!response.text) {
      console.error("Gemini response candidates:", JSON.stringify(response.candidates, null, 2));
      throw new Error('Failed to extract data from the document. The model returned an empty response (possibly due to safety filters or parsing errors).');
    }

    let jsonString = response.text.trim();
    
    // Robust JSON extraction in case of markdown wrapping or truncation
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('Initial JSON parse failed, attempting to clean string...', e);
      // Try to find the first '{' and last '}'
      const start = jsonString.indexOf('{');
      const end = jsonString.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        jsonString = jsonString.substring(start, end + 1);
        try {
          return JSON.parse(jsonString);
        } catch (innerE) {
          console.error("Cleaned JSON parse failed. String might be truncated:", jsonString.substring(jsonString.length - 100));
          throw innerE;
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Content processing error:', error);
    throw error;
  }
};

/**
 * Generates a luxury description for a resort based on its features.
 * 
 * @param resortName - The name of the resort.
 * @param features - A list of features to include in the description.
 * @returns A string containing the generated description.
 */
export const generateResortDescription = async (resortName: string, features: string[]) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Write a luxury, evocative description for a Maldives resort named "${resortName}" with these features: ${features.join(', ')}. Focus on the sensory experience, privacy, and the beauty of the Indian Ocean.`;
  
  try {
    const response = await engine.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Description generation error:', error);
    throw error;
  }
};
