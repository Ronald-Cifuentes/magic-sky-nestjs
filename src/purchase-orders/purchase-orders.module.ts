import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersResolver } from './purchase-orders.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PurchaseOrdersService, PurchaseOrdersResolver],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
