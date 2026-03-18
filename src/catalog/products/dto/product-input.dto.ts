import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, Allow, ValidateNested, IsNumber, IsString, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProductVariantInput {
  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  title?: string;

  @Field()
  @IsNumber()
  @Allow()
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  compareAtPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  sku?: string;
}

@InputType()
export class ProductImageInput {
  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  id?: string;

  @Field()
  @IsString()
  @Allow()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  altText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  position?: number;
}

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @Allow()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  descriptionHtml?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  published?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  featured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  status?: string;

  @Field(() => [ProductVariantInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  @Allow()
  variants: ProductVariantInput[];

  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  @Allow()
  images?: ProductImageInput[];
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  descriptionHtml?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  vendorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  published?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  featured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  status?: string;

  @Field(() => [ProductVariantInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  @Allow()
  variants?: ProductVariantInput[];

  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  @Allow()
  images?: ProductImageInput[];
}
