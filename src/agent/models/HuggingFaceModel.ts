import { IModel, ModelConfig } from './IModel';

export class HuggingFaceModel implements IModel {
  private endpoint: string;
  private apiKey: string;
  private retryDelay = 1000;
  private maxRetries = 3;

  constructor(config: ModelConfig) {
    this.endpoint = 'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct';
    this.apiKey = config.apiKey;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retries));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.fetchWithRetry(
        this.endpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 1000,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true,
              return_full_text: false
            }
          })
        }
      );

      const data = await response.json();
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      } else if (typeof data === 'string') {
        return data;
      } else if (data.error) {
        throw new Error(data.error);
      }

      throw new Error('Invalid response format from Hugging Face API');
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw error;
    }
  }
} 