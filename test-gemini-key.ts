import { GoogleGenAI } from "@google/genai";

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key length:", apiKey ? apiKey.length : 0);
  console.log("API Key prefix:", apiKey ? apiKey.substring(0, 5) : "none");
  
  if (!apiKey || apiKey === 'TODO_KEYHERE' || apiKey === '') {
    console.error("Gemini API key is missing or invalid.");
    return;
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Hello, world!",
    });
    console.log("Success:", result.text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testGemini();
