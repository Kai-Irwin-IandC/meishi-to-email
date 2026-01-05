import { OpenRouter } from "@openrouter/sdk";
import { ExtractedInfo } from "../types";

// Get API key from environment (Vite uses import.meta.env for client-side)
const getApiKey = () => {
  return import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

// Initialize OpenRouter lazily to avoid errors on module load
const getOpenRouter = () => {
  const apiKey = getApiKey();
  console.log('OpenRouter API Key check:', apiKey ? 'Key found' : 'Key MISSING');
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured. Please set openrouter_groq-gptoss_key in your .env.local file.");
  }
  return new OpenRouter({
    apiKey: apiKey
  });
};

/**
 * Extracts company name and person name from a business card image or text.
 */
export const extractBusinessCardInfo = async (
  imageData: string | null,
  textData: string | null
): Promise<ExtractedInfo> => {
  
  const isImageMode = !!imageData;
  
  // Use google/gemini-2.5-flash as requested
  const modelName = "google/gemini-2.5-flash";

  const promptText = `
    You are an expert secretary AI. 
    Analyze the provided business card information.
    Extract the official Company Name (Corporate Entity) and the Person's Name.
    
    Rules:
    1. Extract the full company name (e.g., "Google Inc." not just "Google").
    2. Extract the full person name.
    3. If the company name is missing, return an empty string.
    4. If the person name is missing or unclear, infer strictly from context or return "ご担当者".
    5. Return ONLY a valid JSON object with the structure: {"companyName": "...", "personName": "..."}
  `;

  // Build messages array for OpenRouter
  const contentParts: any[] = [];
  
  // Add text prompt
  contentParts.push({
    type: "text",
    text: promptText
  });

  // Add image if provided
  if (isImageMode && imageData) {
    // Extract mime type and base64 data from data URL
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      contentParts.push({
        type: "image_url",
        imageUrl: {
          url: `data:${mimeType};base64,${base64Data}`
        }
      });
    } else {
      // Fallback if format is unexpected
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      contentParts.push({
        type: "image_url",
        imageUrl: {
          url: `data:image/png;base64,${base64Data}`
        }
      });
    }
  } else if (textData) {
    contentParts.push({
      type: "text",
      text: `Business Card Text Content:\n${textData}`
    });
  }

  // For OpenRouter, content can be a string or array of content parts
  const messages = [
    {
      role: "user" as const,
      content: contentParts.length === 1 && contentParts[0].type === "text" 
        ? contentParts[0].text 
        : contentParts
    }
  ];

  try {
    // Initialize OpenRouter when needed
    const openrouter = getOpenRouter();
    
    // Use streaming as requested in the example
    const response = await openrouter.chat.send({
      model: modelName,
      messages: messages,
      stream: true,
      responseFormat: {
        type: "json_object"
      }
    });

    // Handle streaming response - assemble chunks
    let fullResponse = "";
    
    if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
      for await (const chunk of response as any) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
        }
      }
    } else if (response && typeof response === 'object' && 'choices' in response) {
      // Fallback for non-streaming if SDK behaves differently
      const message = (response as any).choices?.[0]?.message;
      if (message?.content) {
        fullResponse = typeof message.content === 'string' 
          ? message.content 
          : (message.content.find((p: any) => p.type === 'text')?.text || "");
      }
    }

    if (fullResponse) {
      console.log("OpenRouter Full Response Content:", fullResponse);
      // Try to parse JSON from the response
      let jsonText = fullResponse.trim();
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const result = JSON.parse(jsonText) as ExtractedInfo;
      console.log("OpenRouter Parsed Result:", result);
      
      // Validate required fields exist (even if they are empty strings)
      if (result.companyName === undefined || result.personName === undefined) {
        // Try to handle snake_case if the AI ignored the camelCase instruction
        const companyName = result.companyName ?? (result as any).company_name;
        const personName = result.personName ?? (result as any).person_name;
        
        if (companyName === undefined || personName === undefined) {
          throw new Error(`Invalid response format: missing fields. Received keys: ${Object.keys(result).join(', ')}`);
        }
        
        return {
          companyName: companyName || "",
          personName: personName || "ご担当者"
        };
      }
      
      return result;
    } else {
      throw new Error("No response content generated");
    }
  } catch (error: any) {
    console.error("OpenRouter Extraction Error Details:", {
      message: error.message,
      stack: error.stack,
      error: error
    });
    
    // Check for specific error types
    if (error.message?.includes("401")) {
      throw new Error("APIキーが無効です。設定を確認してください。");
    } else if (error.message?.includes("404")) {
      throw new Error("指定されたモデルが見つかりません。モデルIDを確認してください。");
    }
    
    throw new Error(`名刺情報の読み取りに失敗しました: ${error.message || "予期せぬエラー"}`);
  }
};

