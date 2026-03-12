import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
  @Field({ nullable: true }) description?: string;
  @Field() sortOrder: number;
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
}
