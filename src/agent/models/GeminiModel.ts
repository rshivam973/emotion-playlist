import { GoogleGenerativeAI } from '@google/generative-ai';
import { IModel, ModelConfig } from './IModel';

export class GeminiModel implements IModel {
  private apiKey: string;
  private modelName: string;

  constructor(config: ModelConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required. Please check your environment variables.');
    }
    this.apiKey = config.apiKey;
    this.modelName = config.modelName;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
} 