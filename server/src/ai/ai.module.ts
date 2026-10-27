import { Module } from '@nestjs/common';
import { CafesModule } from '../cafes/cafes.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [CafesModule],
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
