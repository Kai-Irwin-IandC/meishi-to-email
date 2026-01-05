import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts company name and person name from a business card image or text.
 */
export const extractBusinessCardInfo = async (
  imageData: string | null,
  textData: string | null
): Promise<ExtractedInfo> => {
  
  const isImageMode = !!imageData;
  
  // Use gemini-3-flash-preview for both text and image understanding tasks.
  // gemini-2.5-flash-image is for IMAGE GENERATION, not understanding.
  // gemini-3-flash-preview supports multimodal input (text + image).
  const modelName = 'gemini-3-flash-preview';

  const promptText = `
    You are an expert secretary AI. 
    Analyze the provided business card information.
    Extract the official Company Name (Corporate Entity) and the Person's Name.
    
    Rules:
    1. Extract the full company name (e.g., "Google Inc." not just "Google").
    2. Extract the full person name.
    3. If the company name is missing, return an empty string.
    4. If the person name is missing or unclear, infer strictly from context or return "ご担当者".
    5. Return ONLY the JSON object.
  `;

  const parts: any[] = [{ text: promptText }];

  if (isImageMode && imageData) {
    // Extract mime type dynamically from data URL to support JPG, PNG, etc.
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    } else {
      // Fallback if format is unexpected
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }
  } else if (textData) {
    parts.push({ text: `Business Card Text Content:\n${textData}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: {
              type: Type.STRING,
              description: "The official name of the company on the card, including legal entity status (e.g., Co., Ltd., 株式会社).",
            },
            personName: {
              type: Type.STRING,
              description: "The full name of the individual on the card.",
            },
          },
          required: ["companyName", "personName"],
        },
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text) as ExtractedInfo;
      return result;
    } else {
      throw new Error("No response text generated");
    }
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("名刺情報の読み取りに失敗しました。もう一度お試しください。");
  }
};
