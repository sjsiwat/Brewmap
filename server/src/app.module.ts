import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CafesModule } from './cafes/cafes.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    // Limits are set per route with @Throttle (auth endpoints only).
    ThrottlerModule.forRoot([{ limit: 100, ttl: 60_000 }]),
    AuthModule,
    CafesModule,
    FavoritesModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
