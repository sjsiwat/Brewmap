import { ConfigService } from '@nestjs/config';
import { ApiError } from '@google/genai';
import { AiUnavailableError, GeminiService } from './gemini.service';

const request = { system: 'sys', prompt: '{}', schema: { type: 'object' } };

function serviceWith(generateContent: jest.Mock) {
  const service = new GeminiService(
    new ConfigService({ GEMINI_API_KEY: 'test', GEMINI_MODEL: 'test-model' }),
  );
  // Swap the SDK client for a stub; nothing leaves the process.
  Object.assign(service, { client: { models: { generateContent } } });
  return service;
}

const busy = () => new ApiError({ message: 'high demand', status: 503 });

describe('GeminiService.generateJson', () => {
  it('retries once when Gemini is busy (503)', async () => {
    const generateContent = jest
      .fn()
      .mockRejectedValueOnce(busy())
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    await expect(
      serviceWith(generateContent).generateJson(request),
    ).resolves.toEqual({
      ok: true,
    });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry, and never retries other errors', async () => {
    const twiceBusy = jest.fn().mockRejectedValue(busy());
    await expect(
      serviceWith(twiceBusy).generateJson(request),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(twiceBusy).toHaveBeenCalledTimes(2);

    const badKey = jest.fn().mockRejectedValue(
      new ApiError({
        message: 'bad key',
        status: 400,
      }),
    );
    await expect(
      serviceWith(badKey).generateJson(request),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(badKey).toHaveBeenCalledTimes(1);
  });

  it('is unavailable without a key or model', async () => {
    const service = new GeminiService(new ConfigService({}));
    await expect(service.generateJson(request)).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });
});
