/**
 * Lists the Gemini models this API key can call with generateContent, so
 * GEMINI_MODEL can be picked from what actually exists. Usage: npm run ai:models
 */
import { join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

async function main() {
  try {
    process.loadEnvFile(join(__dirname, '..', '.env'));
  } catch {
    // No .env file - fall back to the real environment.
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list();
  for await (const model of pager) {
    if (model.supportedActions?.includes('generateContent')) {
      console.log(
        `${model.name?.replace(/^models\//, '')}\t${model.displayName ?? ''}`,
      );
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
