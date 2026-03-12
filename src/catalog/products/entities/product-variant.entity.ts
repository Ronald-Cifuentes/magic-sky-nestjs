import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ProductVariant {
  @Field() id: string;
  @Field({ nullable: true }) sku?: string;
  @Field() title: string;
  @Field() price: number;
  @Field({ nullable: true }) compareAtPrice?: number;
  @Field() requiresShipping: boolean;
  @Field() isTaxable: boolean;
}
