import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ProductVariantInput {
  @Field({ nullable: true }) id?: string;
  @Field({ nullable: true }) title?: string;
  @Field() price: number;
  @Field({ nullable: true }) compareAtPrice?: number;
  @Field({ nullable: true }) sku?: string;
}

@InputType()
export class ProductImageInput {
  @Field({ nullable: true }) id?: string;
  @Field() url: string;
  @Field({ nullable: true }) altText?: string;
  @Field({ nullable: true }) position?: number;
}

@InputType()
export class CreateProductInput {
  @Field() title: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) descriptionHtml?: string;
  @Field({ nullable: true }) shortDescription?: string;
  @Field({ nullable: true }) vendorId?: string;
  @Field({ nullable: true }) categoryId?: string;
  @Field({ nullable: true }) published?: boolean;
  @Field({ nullable: true }) featured?: boolean;
  @Field({ nullable: true }) status?: string;
  @Field(() => [ProductVariantInput]) variants: ProductVariantInput[];
  @Field(() => [ProductImageInput], { nullable: true }) images?: ProductImageInput[];
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true }) title?: string;
  @Field({ nullable: true }) slug?: string;
  @Field({ nullable: true }) descriptionHtml?: string;
  @Field({ nullable: true }) shortDescription?: string;
  @Field({ nullable: true }) vendorId?: string;
  @Field({ nullable: true }) categoryId?: string;
  @Field({ nullable: true }) published?: boolean;
  @Field({ nullable: true }) featured?: boolean;
  @Field({ nullable: true }) status?: string;
  @Field(() => [ProductVariantInput], { nullable: true }) variants?: ProductVariantInput[];
  @Field(() => [ProductImageInput], { nullable: true }) images?: ProductImageInput[];
}
