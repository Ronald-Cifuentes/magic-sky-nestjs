import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { UserType } from '@prisma/client';
import { AdminProfile } from './admin-profile.entity';
import { CustomerProfile } from '../../customers/entities/customer-profile.entity';

registerEnumType(UserType, { name: 'UserType' });

@ObjectType()
export class User {
  @Field() id: string;
  @Field() email: string;
  @Field(() => UserType) userType: UserType;
  @Field() isActive: boolean;
  @Field({ nullable: true }) adminProfile?: AdminProfile;
  @Field({ nullable: true }) customerProfile?: CustomerProfile;
}
