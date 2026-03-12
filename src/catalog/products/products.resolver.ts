import { Resolver, Query, Args } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private products: ProductsService) {}

  @Query(() => [Product])
  async featuredProducts(@Args('limit', { nullable: true }) limit?: number) {
    return this.products.featured(limit ?? 12);
  }

  @Query(() => Product, { nullable: true })
  async productBySlug(@Args('slug') slug: string) {
    return this.products.findBySlug(slug);
  }

  @Query(() => [Product])
  async searchProducts(
    @Args('query') query: string,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.products.search(query, undefined, limit ?? 24);
  }

  @Query(() => [[String]])
  async filterOptions() {
    const opts = await this.products.getFilterOptions();
    return opts.map((o) => [o.key, ...o.values]);
  }

  @Query(() => [Product])
  async recommendationsForProduct(
    @Args('productId') productId: string,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.products.recommendationsForProduct(productId, limit ?? 4);
  }
}
