import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../../auth/guards/gql-admin.guard';
import { CreateProductInput } from './dto/product-input.dto';
import { UpdateProductInput } from './dto/product-input.dto';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private products: ProductsService) {}

  @Query(() => Product, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminProductById(@Args('id') id: string) {
    return this.products.findByIdForAdmin(id);
  }

  @Query(() => [Product])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminProducts(
    @Args('limit', { nullable: true }) limit?: number,
    @Args('skip', { nullable: true }) skip?: number,
  ) {
    return this.products.findAllForAdmin({
      take: limit ?? 100,
      skip: skip ?? 0,
      orderBy: { createdAt: 'desc' },
    });
  }

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

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateProduct(@Args('input') input: CreateProductInput) {
    return this.products.create(input as any);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateProduct(
    @Args('id') id: string,
    @Args('input') input: UpdateProductInput,
  ) {
    return this.products.update(id, input as any);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteProduct(@Args('id') id: string) {
    return this.products.delete(id);
  }
}
