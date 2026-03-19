import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryAdminService } from './inventory-admin.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class InventoryItemType {
  @Field() variantId: string;
  @Field() productId: string;
  @Field() productTitle: string;
  @Field(() => String, { nullable: true }) productImageUrl?: string | null;
  @Field(() => String, { nullable: true }) sku?: string | null;
  @Field() unavailable: number;
  @Field() committed: number;
  @Field() available: number;
  @Field() onHand: number;
}

@ObjectType()
class AdminInventoryResultType {
  @Field(() => [InventoryItemType]) items: InventoryItemType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver()
export class InventoryAdminResolver {
  constructor(private inventory: InventoryAdminService) {}

  @Query(() => AdminInventoryResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminInventoryItems(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('sortBy', { nullable: true }) sortBy?: string,
  ) {
    return this.inventory.findAllPaginated({ page, pageSize, search, sortBy });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateInventoryStock(
    @Args('variantId') variantId: string,
    @Args('quantity') quantity: number,
  ) {
    await this.inventory.updateStock(variantId, quantity);
    return true;
  }
}
