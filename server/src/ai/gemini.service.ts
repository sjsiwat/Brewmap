import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';

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

const RETRY_DELAY_MS = 800;

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
  private readonly thinkingLevel: ThinkingLevel | undefined;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = config.get<string>('GEMINI_MODEL');
    this.timeoutMs = Number(config.get<string>('GEMINI_TIMEOUT_MS') ?? 15_000);
    // Filter extraction needs little reasoning; "minimal" cuts a 10-20s reply
    // to ~2s on the lite models. Unset = the model's default.
    const level = config
      .get<string>('GEMINI_THINKING_LEVEL')
      ?.trim()
      .toUpperCase();
    this.thinkingLevel =
      level && level in ThinkingLevel
        ? ThinkingLevel[level as keyof typeof ThinkingLevel]
        : undefined;
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
    // One deadline for the whole call, retries included.
    const abortSignal = AbortSignal.timeout(this.timeoutMs);
    const send = () =>
      this.client!.models.generateContent({
        model: this.model!,
        contents: request.prompt,
        config: {
          systemInstruction: request.system,
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
          temperature: 0.2,
          ...(this.thinkingLevel && {
            thinkingConfig: { thinkingLevel: this.thinkingLevel },
          }),
          abortSignal,
        },
      });
    try {
      let response;
      try {
        response = await send();
      } catch (error) {
        // "Model is experiencing high demand" is usually gone a moment later.
        if (!(error instanceof ApiError && error.status === 503)) throw error;
        this.logger.warn('Gemini busy (503), retrying once');
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        response = await send();
      }
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
