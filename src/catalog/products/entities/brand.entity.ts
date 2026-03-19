import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Brand {
  @Field() id: string;
  @Field() name: string;
  @Field() slug: string;
  @Field(() => String, { nullable: true }) description?: string | null;
  @Field(() => String, { nullable: true }) logoUrl?: string | null;
}
