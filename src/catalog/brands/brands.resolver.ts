import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from '../products/entities/brand.entity';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../../auth/guards/gql-admin.guard';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class AdminBrandsResultType {
  @Field(() => [Brand]) items: Brand[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver(() => Brand)
export class BrandsResolver {
  constructor(private brands: BrandsService) {}

  @Query(() => [Brand])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminBrands() {
    return this.brands.findAll();
  }

  @Query(() => AdminBrandsResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminBrandsPaginated(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.brands.findAllPaginated({ page, pageSize, search });
  }

  @Query(() => Brand, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminBrandById(@Args('id') id: string) {
    return this.brands.findById(id);
  }

  @Mutation(() => Brand)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateBrand(
    @Args('name') name: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('logoUrl', { nullable: true }) logoUrl?: string,
  ) {
    return this.brands.create({ name, slug, description, logoUrl });
  }

  @Mutation(() => Brand)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateBrand(
    @Args('id') id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('logoUrl', { nullable: true }) logoUrl?: string,
  ) {
    return this.brands.update(id, { name, description, logoUrl });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteBrand(@Args('id') id: string) {
    return this.brands.delete(id);
  }
}
