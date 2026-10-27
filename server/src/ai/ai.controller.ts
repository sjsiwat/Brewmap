import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClientIpThrottlerGuard } from '../auth/client-ip-throttler.guard';
import { AiService } from './ai.service';
import { AiFindDto, AiFindResponseDto } from './dto/ai.dto';
import { AiUnavailableError } from './gemini.service';

// Each call costs two Gemini requests: keep it to a human pace per visitor.
const AI_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('ai')
@Controller('ai')
@UseGuards(ClientIpThrottlerGuard)
@Throttle(AI_RATE_LIMIT)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** Natural-language café search (Thai or English). Gemini down -> 503. */
  @Post('find')
  @HttpCode(HttpStatus.OK)
  async find(@Body() dto: AiFindDto): Promise<AiFindResponseDto> {
    try {
      return await this.aiService.find(dto);
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        throw new ServiceUnavailableException(
          'AI Finder is unavailable right now. Try the filters instead.',
        );
      }
      throw error;
    }
  }
}
