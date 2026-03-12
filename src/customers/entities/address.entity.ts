import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Address {
  @Field() id: string;
  @Field() address1: string;
  @Field({ nullable: true }) address2?: string;
  @Field() city: string;
  @Field({ nullable: true }) province?: string;
  @Field() countryCode: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) phone?: string;
}
