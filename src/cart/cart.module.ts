import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartResolver, CartItemResolver } from './cart.resolver';

@Module({
  providers: [CartService, CartResolver, CartItemResolver],
  exports: [CartService],
})
export class CartModule {}
