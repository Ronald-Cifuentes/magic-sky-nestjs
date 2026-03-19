import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartResolver, CartItemResolver } from './cart.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [CartService, CartResolver, CartItemResolver],
  exports: [CartService],
})
export class CartModule {}
