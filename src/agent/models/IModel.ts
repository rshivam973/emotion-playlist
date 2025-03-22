export interface IModel {
  generateContent(prompt: string): Promise<string>;
}

export interface ModelConfig {
  apiKey: string;
  modelName: string;
  version?: string;
} 