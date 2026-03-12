import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ProductImage {
  @Field() id: string;
  @Field() url: string;
  @Field({ nullable: true }) altText?: string;
  @Field() position: number;
}
