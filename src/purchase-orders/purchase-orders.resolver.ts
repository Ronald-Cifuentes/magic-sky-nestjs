import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class PurchaseOrderItemType {
  @Field() id: string;
  @Field(() => String, { nullable: true }) productId?: string | null;
  @Field(() => String, { nullable: true }) variantId?: string | null;
  @Field() quantity: number;
  @Field(() => Int, { nullable: true }) unitCost?: number | null;
}

@ObjectType()
class PurchaseOrderType {
  @Field() id: string;
  @Field() poNumber: string;
  @Field(() => String, { nullable: true }) supplierId?: string | null;
  @Field() status: string;
  @Field() total: number;
  @Field() currency: string;
  @Field(() => Date, { nullable: true }) expectedDate?: Date | null;
  @Field() createdAt: Date;
  @Field(() => [PurchaseOrderItemType]) items: PurchaseOrderItemType[];
}

@ObjectType()
class AdminPurchaseOrdersResultType {
  @Field(() => [PurchaseOrderType]) items: PurchaseOrderType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver()
export class PurchaseOrdersResolver {
  constructor(private purchaseOrders: PurchaseOrdersService) {}

  @Query(() => AdminPurchaseOrdersResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminPurchaseOrders(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('status', { nullable: true }) status?: string,
  ) {
    return this.purchaseOrders.findAllPaginated({ page, pageSize, search, status });
  }

  @Query(() => PurchaseOrderType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminPurchaseOrderById(@Args('id') id: string) {
    return this.purchaseOrders.findById(id);
  }

  @Mutation(() => PurchaseOrderType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreatePurchaseOrder(
    @Args('itemsJson', { nullable: true }) itemsJson?: string,
  ) {
    const items = itemsJson ? (JSON.parse(itemsJson) as { productId?: string; variantId?: string; quantity: number; unitCost?: number }[]) : [];
    return this.purchaseOrders.create({ items });
  }

  @Mutation(() => PurchaseOrderType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdatePurchaseOrder(
    @Args('id') id: string,
    @Args('status', { nullable: true }) status?: string,
  ) {
    return this.purchaseOrders.update(id, { status });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeletePurchaseOrder(@Args('id') id: string) {
    return this.purchaseOrders.delete(id);
  }
}
