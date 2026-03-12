import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Brand {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
}
