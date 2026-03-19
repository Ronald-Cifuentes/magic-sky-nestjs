import { Module } from '@nestjs/common';
import { InventoryAdminService } from './inventory-admin.service';
import { InventoryAdminResolver } from './inventory-admin.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [InventoryAdminService, InventoryAdminResolver],
  exports: [InventoryAdminService],
})
export class InventoryModule {}
