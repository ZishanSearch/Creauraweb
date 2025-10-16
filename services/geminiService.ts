import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeImageStyle(
  targetImageBase64: string,
  targetImageMimeType: string
): Promise<string> {
  const model = 'gemini-2.5-flash';
  const prompt = "Analyze and describe this image's visual characteristics in detail. Focus on elements needed for artistic replication. Cover: lighting (e.g., 'soft, diffused window light'), pose, background (e.g., 'blurry, urban city street at night'), artistic style (e.g., 'vintage, cinematic, 90s film look'), outfit details, and camera angle (e.g., 'low-angle shot').";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: targetImageBase64,
              mimeType: targetImageMimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    if (error instanceof Error) {
        if(error.message.includes('API key not valid')) {
            throw new Error('Invalid API Key. Please check your configuration.');
        }
        throw new Error(`Failed to analyze image style: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image analysis.');
  }
}

export async function generateStyledImage(
  userImageBase64: string,
  userImageMimeType: string,
  styleDescription: string
): Promise<string | null> {
  
  const model = 'gemini-2.5-flash-image';
  
  const finalPrompt = `**PRIMARY GOAL: Recreate the provided image of a person to match a new artistic style.**

**INPUTS:**
1.  **USER IMAGE:** The image of the person to be edited.
2.  **STYLE DESCRIPTION:** A detailed text description of the target style.

**STYLE DESCRIPTION TO APPLY:**
---
${styleDescription}
---

**CRITICAL INSTRUCTIONS:**
1.  **IDENTITY PRESERVATION (ABSOLUTE PRIORITY):** The face of the person in the USER IMAGE must be preserved with 100% accuracy. Do not alter their facial features, expression, or identity in any way. This is the most important rule.
2.  **STYLE APPLICATION:** Apply all the elements from the STYLE DESCRIPTION to the USER IMAGE. This includes the lighting, background, pose, outfit, and overall artistic mood.
3.  **SEAMLESS INTEGRATION:** The final result should be a high-quality, photorealistic image where the original person looks naturally placed within the new, described environment and style.

**TASK:** Generate the edited image based on these rules.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: userImageBase64,
              mimeType: userImageMimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;

  } catch (error) {
    console.error("Error calling Gemini API for generation:", error);
    if (error instanceof Error) {
        if(error.message.includes('API key not valid')) {
            throw new Error('Invalid API Key. Please check your configuration.');
        }
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the image.');
  }
}
