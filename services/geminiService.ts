import { GoogleGenAI, Chat } from "@google/genai";

// The API key is assumed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Identifies a plant from an image using the Gemini API.
 * @param imageBase64 The base64-encoded image data.
 * @param mimeType The MIME type of the image.
 * @param language The desired language for the response ('en' or 'fa').
 * @returns A promise that resolves to the markdown text description of the plant.
 */
export const identifyPlant = async (imageBase64: string, mimeType: string, language: 'en' | 'fa'): Promise<string> => {
  const langInstruction = language === 'fa' 
    ? "Provide the response in Persian (Farsi)."
    : "Provide the response in English.";

  const prompt = `
    Please identify the plant in this image. Provide a detailed description covering the following sections.
    Format the output in Markdown. Each section should have a bolded title followed by a colon, like this: **Section Title:**

    1.  **Plant Name:** Use the following sub-headings for the common and scientific names. For Farsi responses, translate the sub-headings too (Common Name -> نام رایج, Scientific Name -> نام علمی).
        **Common Name:** [Common Name]
        **Scientific Name:** [Scientific Name]
    2.  **Introduction:** A brief, engaging introduction to the plant.
    3.  **Care Instructions:** Detailed care instructions with subsections for:
        *   **Light:**
        *   **Watering:**
        *   **Soil:**
        *   **Temperature & Humidity:**
        *   **Fertilizing:**
    4.  **Common Problems:** A list of common pests or diseases, and how to deal with them.
    
    If you cannot identify the plant, please state that clearly.
  `;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  const textPart = {
      text: prompt
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: langInstruction
        }
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the API.");
    }
    return text;
  } catch (error) {
    console.error("Error identifying plant:", error);
    throw new Error("Failed to identify plant. Please check the console for details.");
  }
};

/**
 * Creates a new chat session with the Gemini API.
 * @param plantInfo The initial context about the plant.
 * @param language The language for the chat session.
 * @returns A Chat instance.
 */
export const createChat = (plantInfo: string, language: 'en' | 'fa'): Chat => {
  const langInstruction = language === 'fa' 
    ? "You must respond in Persian (Farsi)."
    : "You must respond in English.";
    
  const botWelcomeMessage = language === 'fa'
    ? "من آماده ام تا در مورد گیاهتان به شما کمک کنم. مایلید چه چیزی بدانید؟"
    : "I'm ready to help you with your plant. What would you like to know?";

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [
      {
        role: "user",
        parts: [{text: `I have a plant. Here is its information:\n\n${plantInfo}\n\nI want to chat with you about it. Please act as a plant care expert.`}],
      },
      {
        role: "model",
        parts: [{text: botWelcomeMessage}],
      },
    ],
    config: {
        systemInstruction: langInstruction
    }
  });

  return chat;
};