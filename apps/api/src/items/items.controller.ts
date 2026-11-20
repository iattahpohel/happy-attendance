import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ItemsService } from './items.service';

class EquipDto {
  @IsBoolean() equipped: boolean;
}

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  catalog(@CurrentUser() user: AuthUser) {
    return this.items.catalog(user.id);
  }

  @Patch(':itemId/equip')
  equip(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string, @Body() dto: EquipDto) {
    return this.items.setEquipped(user.id, itemId, dto.equipped);
  }
}
