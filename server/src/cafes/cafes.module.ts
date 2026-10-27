import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CafesController } from './cafes.controller';
import { CafesService } from './cafes.service';
import { Cafe, CafeSchema } from './schemas/cafe.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cafe.name, schema: CafeSchema }]),
  ],
  controllers: [CafesController],
  providers: [CafesService],
  exports: [CafesService],
})
export class CafesModule {}
