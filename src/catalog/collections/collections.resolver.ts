import { Resolver, Query, Args } from '@nestjs/graphql';
import { CollectionsService } from './collections.service';
import { ObjectType, Field } from '@nestjs/graphql';
import { Product } from '../products/entities/product.entity';

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
}
