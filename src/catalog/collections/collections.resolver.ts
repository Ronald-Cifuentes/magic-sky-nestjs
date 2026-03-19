import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { ObjectType, Field } from '@nestjs/graphql';
import { Product } from '../products/entities/product.entity';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../../auth/guards/gql-admin.guard';

@ObjectType()
export class CollectionProductEdge {
  @Field(() => Product) product: Product;
  @Field() sortOrder: number;
}

@ObjectType()
export class CollectionType {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) imageUrl?: string;
  @Field(() => [CollectionProductEdge])
  products: CollectionProductEdge[];
}

@ObjectType()
class AdminCollectionsResultType {
  @Field(() => [CollectionType]) items: CollectionType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver(() => CollectionType)
export class CollectionsResolver {
  constructor(private collectionsService: CollectionsService) {}

  @Query(() => [CollectionType])
  async collections() {
    const cols = await this.collectionsService.findAll();
    return cols.map((c) => ({
      ...c,
      products: c.products.map((p) => ({ product: p.product, sortOrder: p.sortOrder })),
    }));
  }

  @Query(() => CollectionType, { nullable: true })
  async collectionBySlug(@Args('slug') slug: string) {
    const col = await this.collectionsService.findBySlug(slug);
    if (!col) return null;
    return {
      ...col,
      products: col.products.map((p) => ({ product: p.product, sortOrder: p.sortOrder })),
    };
  }

  @Query(() => AdminCollectionsResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCollections(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('sortBy', { nullable: true }) sortBy?: string,
    @Args('sortOrder', { nullable: true }) sortOrder?: string,
  ) {
    const result = await this.collectionsService.findAllForAdminPaginated({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
    });
    return {
      ...result,
      items: result.items.map((c) => ({
        ...c,
        products: c.products.map((p: any) => ({ product: p.product, sortOrder: p.sortOrder })),
      })),
    };
  }

  @Query(() => CollectionType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCollectionById(@Args('id') id: string) {
    const col = await this.collectionsService.findByIdForAdmin(id);
    if (!col) return null;
    return {
      ...col,
      products: col.products.map((p: any) => ({ product: p.product, sortOrder: p.sortOrder })),
    };
  }

  @Mutation(() => CollectionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateCollection(
    @Args('name') name: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
  ) {
    return this.collectionsService.create({ name, slug, description, imageUrl });
  }

  @Mutation(() => CollectionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateCollection(
    @Args('id') id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('published', { nullable: true }) published?: boolean,
  ) {
    return this.collectionsService.update(id, { name, slug, description, imageUrl, published });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteCollection(@Args('id') id: string) {
    return this.collectionsService.delete(id);
  }

  @Mutation(() => CollectionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminAddProductsToCollection(
    @Args('collectionId') collectionId: string,
    @Args('productIds', { type: () => [String] }) productIds: string[],
  ) {
    return this.collectionsService.addProducts(collectionId, productIds);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminRemoveProductFromCollection(
    @Args('collectionId') collectionId: string,
    @Args('productId') productId: string,
  ) {
    return this.collectionsService.removeProduct(collectionId, productId);
  }
}
