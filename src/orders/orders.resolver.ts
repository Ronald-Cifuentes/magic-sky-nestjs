import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CustomersService } from '../customers/customers.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { GqlCustomerGuard } from '../auth/guards/gql-customer.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderItemType {
  @Field() id: string;
  @Field() productTitle: string;
  @Field() variantTitle: string;
  @Field() quantity: number;
  @Field() unitPrice: number;
  @Field() totalPrice: number;
}

@ObjectType()
export class OrderType {
  @Field() id: string;
  @Field() orderNumber: string;
  @Field() email: string;
  @Field(() => OrderStatus) status: OrderStatus;
  @Field() subtotal: number;
  @Field() total: number;
  @Field() currency: string;
  @Field(() => [OrderItemType]) items: OrderItemType[];
}

@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(
    private orders: OrdersService,
    private customers: CustomersService,
  ) {}

  @Mutation(() => OrderType)
  async createOrderFromCart(
    @Args('cartId') cartId: string,
    @Args('email') email: string,
    @Args('shippingAddress', { type: () => String }) shippingAddressJson: string,
    @Args('customerId', { nullable: true }) customerId?: string,
  ) {
    const shippingAddress = JSON.parse(shippingAddressJson);
    return this.orders.createFromCart(cartId, email, shippingAddress, customerId);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminOrders(@Args('limit', { nullable: true }) limit?: number) {
    return this.orders.findAll(limit ?? 50);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async listMyOrders(@CurrentUser() user: User) {
    const profile = await this.customers.getProfile(user.id);
    if (!profile) return [];
    return this.orders.findByCustomer(profile.id);
  }

  @Query(() => OrderType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async myOrderByNumber(
    @CurrentUser() user: User,
    @Args('orderNumber') orderNumber: string,
  ) {
    const profile = await this.customers.getProfile(user.id);
    if (!profile) return null;
    return this.orders.findByNumber(orderNumber, profile.id);
  }
}
