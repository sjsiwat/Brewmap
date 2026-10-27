import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

/** Gemini is not configured, timed out, failed, or returned something unusable. */
export class AiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AiUnavailableError';
  }
}

export interface JsonRequest {
  /** Fixed instructions. User text goes in `prompt`, never here. */
  system: string;
  prompt: string;
  /** JSON Schema the response must follow (Gemini structured output). */
  schema: Record<string, unknown>;
}

/**
 * Thin wrapper over the Gemini SDK. The API key and model name come from env
 * and stay on the server. Every failure becomes AiUnavailableError so callers
 * have one thing to handle.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string | undefined;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = config.get<string>('GEMINI_MODEL');
    this.timeoutMs = Number(config.get<string>('GEMINI_TIMEOUT_MS') ?? 15_000);
  }

  get modelName(): string | undefined {
    return this.model;
  }

  async generateJson(request: JsonRequest): Promise<unknown> {
    if (!this.client || !this.model) {
      throw new AiUnavailableError(
        'GEMINI_API_KEY and GEMINI_MODEL must be set',
      );
    }
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: request.prompt,
        config: {
          systemInstruction: request.system,
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
          temperature: 0.2,
          abortSignal: AbortSignal.timeout(this.timeoutMs),
        },
      });
      const text = response.text;
      if (!text) throw new Error('empty response');
      return JSON.parse(text) as unknown;
    } catch (error) {
      // Log the cause for us; callers only ever see a generic message.
      this.logger.warn(
        `Gemini request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new AiUnavailableError('Gemini request failed', { cause: error });
    }
  }
}
