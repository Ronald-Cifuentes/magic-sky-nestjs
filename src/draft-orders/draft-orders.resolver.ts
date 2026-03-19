import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DraftOrdersService } from './draft-orders.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class DraftOrderItemType {
  @Field() id: string;
  @Field() variantId: string;
  @Field() quantity: number;
  @Field() unitPrice: number;
  @Field() totalPrice: number;
}

@ObjectType()
class DraftOrderType {
  @Field() id: string;
  @Field() draftNumber: string;
  @Field(() => String, { nullable: true }) email?: string;
  @Field() status: string;
  @Field() total: number;
  @Field() currency: string;
  @Field() createdAt: Date;
  @Field(() => [DraftOrderItemType]) items: DraftOrderItemType[];
}

@ObjectType()
class AdminDraftOrdersResultType {
  @Field(() => [DraftOrderType]) items: DraftOrderType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver(() => DraftOrderType)
export class DraftOrdersResolver {
  constructor(private draftOrders: DraftOrdersService) {}

  @Query(() => AdminDraftOrdersResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDraftOrders(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('status', { nullable: true }) status?: string,
  ) {
    return this.draftOrders.findAllPaginated({ page, pageSize, search, status });
  }

  @Query(() => DraftOrderType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDraftOrderById(@Args('id') id: string) {
    return this.draftOrders.findById(id);
  }

  @Mutation(() => DraftOrderType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateDraftOrder(
    @Args('customerId', { nullable: true }) customerId?: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('itemsJson', { nullable: true }) itemsJson?: string,
  ) {
    const items = itemsJson ? (JSON.parse(itemsJson) as { variantId: string; quantity: number; unitPrice: number }[]) : [];
    return this.draftOrders.create({ customerId, email, items });
  }

  @Mutation(() => DraftOrderType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateDraftOrder(
    @Args('id') id: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('email', { nullable: true }) email?: string,
  ) {
    return this.draftOrders.update(id, { status, email });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteDraftOrder(@Args('id') id: string) {
    return this.draftOrders.delete(id);
  }

  @ResolveField(() => String, { nullable: true })
  customerName(@Parent() draft: { customer?: { firstName: string; lastName: string } | null }) {
    if (!draft.customer) return null;
    return `${draft.customer.firstName} ${draft.customer.lastName}`.trim();
  }
}
