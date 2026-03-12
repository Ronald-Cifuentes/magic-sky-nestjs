import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Role {
  @Field() id: string;
  @Field() code: string;
  @Field() name: string;
}
