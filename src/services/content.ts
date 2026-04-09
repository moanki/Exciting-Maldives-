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
                  max_guests: { type: Type.STRING, description: "Maximum number of guests, e.g., '2 Adults + 1 Child' or '3'" },
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
  } catch (error: any) {
    console.error('Content processing error:', error);
    
    // Check for quota exhaustion (429 Too Many Requests)
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      throw new Error('API tokens exhausted. Please switch to a paid Gemini API key in your environment variables to continue processing.');
    }
    
    throw error;
  }
};

/**
 * Generates comprehensive luxury marketing copy for a resort.
 * 
 * @param resortData - The current resort data.
 * @returns A structured object with marketing hooks, USPs, and descriptions.
 */
export const generateResortMarketingCopy = async (resortData: any) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are a luxury travel copywriter for "Exciting Maldives", a B2B DMC. 
    Create high-end marketing copy for the following resort:
    Name: ${resortData.name}
    Location: ${resortData.location} (${resortData.atoll})
    Category: ${resortData.category}
    Features: ${resortData.highlights?.join(', ')}
    Meal Plans: ${resortData.meal_plans?.join(', ')}

    Return a JSON object with:
    - marketing_hook: A one-sentence punchy headline for travel agents.
    - unique_selling_points: 3-5 bullet points focusing on B2B value.
    - luxury_description: A 2-paragraph evocative description for a brochure.
    - ideal_for: Who is the target client? (e.g., Honeymooners, Multi-gen families, Divers).
  `;

  try {
    const response = await engine.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketing_hook: { type: Type.STRING },
            unique_selling_points: { type: Type.ARRAY, items: { type: Type.STRING } },
            luxury_description: { type: Type.STRING },
            ideal_for: { type: Type.STRING }
          }
        }
      }
    });
    if (!response.text) throw new Error('AI failed to generate marketing copy');
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Marketing copy generation error:', error);
    throw error;
  }
};

/**
 * Classifies an image using AI (Gemini Vision).
 * 
 * @param base64Image - The base64 encoded image data.
 * @returns A suggested category and subcategory.
 */
export const classifyImageWithAI = async (base64Image: string) => {
  const model = "gemini-1.5-flash"; // Use flash for faster/cheaper vision tasks
  
  const prompt = `
    Analyze this image of a Maldives resort and classify it into one of these categories:
    - main_hero (exterior shots, aerials, main pool, landing)
    - room_types (bedrooms, bathrooms, villa interiors)
    - restaurants (dining areas, food, bars)
    - spa (wellness areas, gym, massage rooms)
    - activities (diving, excursions, kids club)
    - maps (site plans, floor plans)
    - logos (brand logos)
    - beaches (beach shots, ocean views)

    Return a JSON object with:
    - category: The chosen category key.
    - subcategory: A more specific label if applicable (e.g., "Water Villa", "Italian Restaurant").
    - description: A brief alt-text description.
  `;

  try {
    const response = await engine.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Image } }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) throw new Error('AI failed to classify image');
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Image classification error:', error);
    return null; // Fallback to manual classification
  }
};
