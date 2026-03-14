import { ObjectType, Field } from '@nestjs/graphql';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

@ObjectType()
export class Product {
  @Field() id: string;
  @Field() slug: string;
  @Field() title: string;
  @Field({ nullable: true }) descriptionHtml?: string;
  @Field({ nullable: true }) shortDescription?: string;
  @Field() published: boolean;
  @Field() featured: boolean;
  @Field() status: string;
  @Field(() => [ProductVariant]) variants: ProductVariant[];
  @Field(() => [ProductImage]) images: ProductImage[];
  @Field(() => Brand, { nullable: true }) vendor?: Brand;
  @Field(() => Category, { nullable: true }) category?: Category;
}
