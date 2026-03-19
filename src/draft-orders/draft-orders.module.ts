import { Module } from '@nestjs/common';
import { DraftOrdersService } from './draft-orders.service';
import { DraftOrdersResolver } from './draft-orders.resolver';

@Module({
  providers: [DraftOrdersService, DraftOrdersResolver],
  exports: [DraftOrdersService],
})
export class DraftOrdersModule {}
