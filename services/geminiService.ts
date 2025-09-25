import { GoogleGenAI, Type } from "@google/genai";
import type { Flashcard } from '../types';

export const generateFlashcards = async (notes: string): Promise<Flashcard[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Analyze the following text and generate a comprehensive set of flashcards from it. Each flashcard must have a 'term' and a 'definition'. The term should be a key concept, vocabulary word, or important name from the text. The definition should be a concise explanation based on the information provided in the text. Determine the appropriate number of flashcards based on the density of important information. Focus on creating high-quality, relevant flashcards.

Here is the text to analyze:
---
${notes}
---`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              description: "An array of flashcard objects extracted from the provided text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  term: {
                    type: Type.STRING,
                    description: "The vocabulary word or concept. Should be specific and relevant."
                  },
                  definition: {
                    type: Type.STRING,
                    description: "The definition or explanation of the term. Should be clear and concise."
                  }
                },
                required: ["term", "definition"]
              }
            }
          },
          required: ["flashcards"]
        },
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      return parsed.flashcards.map((card: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        term: card.term,
        definition: card.definition,
      }));
    } else {
      console.error("Unexpected JSON structure:", parsed);
      throw new Error("AI response did not contain a valid 'flashcards' array.");
    }
  } catch (error) {
    console.error("Error generating flashcards with Gemini:", error);
    throw new Error("Failed to generate flashcards. The AI may be experiencing issues or the provided text is too complex. Please try again.");
  }
};

export const generateMcqOptions = async (term: string, definition: string, allTerms: string[]): Promise<string[]> => {
  if (!process.env.API_KEY) {
    // Fallback if no API key
    console.warn("API_KEY not set, using fallback for MCQ options.");
    const shuffled = [...allTerms].filter(t => t.toLowerCase() !== term.toLowerCase()).sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `For the flashcard term "${term}" with the definition "${definition}", generate exactly three plausible but incorrect multiple-choice options (distractors). These options should be related to the same topic but definitively wrong. Do not include the correct term ("${term}") in your list of options. The options should be concise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              description: "An array of three incorrect multiple-choice options.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["options"]
        },
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.options && Array.isArray(parsed.options) && parsed.options.length >= 3) {
      return parsed.options.slice(0, 3);
    } else {
      throw new Error("AI response did not contain a valid 'options' array with 3 items.");
    }
  } catch (error) {
    console.error("Error generating MCQ options with Gemini, using fallback:", error);
    // Fallback logic in case of API error
    const shuffled = [...allTerms].filter(t => t.toLowerCase() !== term.toLowerCase()).sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }
};