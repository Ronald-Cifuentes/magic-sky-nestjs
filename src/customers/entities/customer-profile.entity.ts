import { ObjectType, Field } from '@nestjs/graphql';
import { Address } from './address.entity';
import { SkinProfile } from './skin-profile.entity';

@ObjectType()
export class CustomerProfile {
  @Field() id: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field({ nullable: true }) phone?: string;
  @Field() totalSpent: number;
  @Field() totalOrders: number;
  @Field(() => Address, { nullable: true }) defaultAddress?: Address;
  @Field(() => SkinProfile, { nullable: true }) skinProfile?: SkinProfile;
}
