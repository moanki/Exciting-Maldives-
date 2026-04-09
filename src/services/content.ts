/**
 * Content Processing Service
 * 
 * This service handles advanced content extraction and generation tasks.
 * It calls secure backend API endpoints to protect API keys and sensitive logic.
 */

import axios from 'axios';

/**
 * Extracts structured resort data from a PDF document.
 * 
 * @param base64Data - The base64 encoded PDF data.
 * @returns A structured object containing resort information.
 */
export const extractResortDataFromPDF = async (base64Data: string) => {
  try {
    const response = await axios.post('/api/ai/extract-resort-pdf', { base64Data });
    return response.data;
  } catch (error: any) {
    console.error('Content processing error:', error);
    const message = error.response?.data?.error || error.message;
    
    if (message.includes('429') || message.includes('quota')) {
      throw new Error('AI quota exhausted. Please try again later or check your API configuration.');
    }
    
    throw new Error(message);
  }
};

/**
 * Generates comprehensive luxury marketing copy for a resort.
 * 
 * @param resortData - The current resort data.
 * @returns A structured object with marketing hooks, USPs, and descriptions.
 */
export const generateResortMarketingCopy = async (resortData: any) => {
  try {
    const response = await axios.post('/api/ai/generate-resort-marketing', { resortData });
    return response.data;
  } catch (error: any) {
    console.error('Marketing copy generation error:', error);
    throw new Error(error.response?.data?.error || error.message);
  }
};

/**
 * Classifies an image using AI (Gemini Vision).
 * 
 * @param base64Image - The base64 encoded image data.
 * @returns A suggested category and subcategory.
 */
export const classifyImageWithAI = async (base64Image: string) => {
  try {
    const response = await axios.post('/api/ai/classify-image', { base64Image });
    return response.data;
  } catch (error: any) {
    console.error('Image classification error:', error);
    return null; // Fallback to manual classification
  }
};
