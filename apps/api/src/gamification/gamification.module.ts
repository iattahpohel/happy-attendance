import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module';
import { GamificationController } from './gamification.controller';
import { GamificationListener } from './gamification.listener';
import { GamificationService } from './gamification.service';

@Module({
  imports: [ItemsModule],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationListener],
  exports: [GamificationService],
})
export class GamificationModule {}
