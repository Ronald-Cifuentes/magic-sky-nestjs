import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../../auth/guards/gql-admin.guard';

@ObjectType()
export class CategoryType {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field() sortOrder: number;
}

@InputType()
export class CreateCategoryInput {
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) sortOrder?: number;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) sortOrder?: number;
}

@Resolver(() => CategoryType)
export class CategoriesResolver {
  constructor(private categoriesService: CategoriesService) {}

  @Query(() => [CategoryType])
  async categories() {
    return this.categoriesService.findAll();
  }

  @Query(() => CategoryType, { nullable: true })
  async categoryBySlug(@Args('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Query(() => [CategoryType])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCategories() {
    return this.categoriesService.findAll();
  }

  @Mutation(() => CategoryType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoriesService.create(input as any);
  }

  @Mutation(() => CategoryType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateCategory(@Args('id') id: string, @Args('input') input: UpdateCategoryInput) {
    return this.categoriesService.update(id, input as any);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteCategory(@Args('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
