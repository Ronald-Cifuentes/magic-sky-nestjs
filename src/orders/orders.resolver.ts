import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
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
  @Field() createdAt: Date;
  @Field(() => [OrderItemType]) items: OrderItemType[];
}

@ObjectType()
export class AdminOrdersResultType {
  @Field(() => [OrderType]) items: OrderType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(
    private orders: OrdersService,
    private customers: CustomersService,
  ) {}

  @Query(() => OrderType, { nullable: true })
  async orderById(@Args('id') id: string) {
    return this.orders.findById(id);
  }

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

  @Query(() => AdminOrdersResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminOrdersPaginated(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('status', { nullable: true }) status?: OrderStatus,
    @Args('paymentStatus', { nullable: true }) paymentStatus?: string,
    @Args('fulfillmentStatus', { nullable: true }) fulfillmentStatus?: string,
  ) {
    return this.orders.findAllPaginated({
      page,
      pageSize,
      search,
      status,
      paymentStatus,
      fulfillmentStatus,
    });
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateOrderStatus(
    @Args('id') id: string,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ) {
    return this.orders.updateStatus(id, status);
  }

  @ResolveField(() => String, { nullable: true })
  customerName(@Parent() order: { customer?: { firstName: string; lastName: string } | null }) {
    if (!order.customer) return null;
    return `${order.customer.firstName} ${order.customer.lastName}`.trim();
  }

  @ResolveField(() => String)
  paymentStatus(@Parent() order: { payments?: { status: string }[]; status: string }) {
    if (order.status === 'CANCELLED') return 'Anulado';
    const paid = order.payments?.some((p) => p.status === 'APPROVED');
    if (paid) return 'Pagado';
    return 'No pagado';
  }

  @ResolveField(() => String)
  fulfillmentStatus(@Parent() order: { shipments?: { status: string }[] }) {
    const fulfilled = order.shipments?.some((s) => s.status && s.status !== 'pending');
    return fulfilled ? 'Preparado' : 'No preparado';
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async cancelOrder(@CurrentUser() user: User, @Args('orderId') orderId: string) {
    return this.orders.cancelOrderByCustomer(orderId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteOrder(@Args('id') id: string) {
    await this.orders.adminDeleteOrder(id);
    return true;
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
