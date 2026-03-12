import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Category {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
}
