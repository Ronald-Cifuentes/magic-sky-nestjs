import { ObjectType, Field } from '@nestjs/graphql';
import { Role } from './role.entity';

@ObjectType()
export class AdminProfile {
  @Field() id: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field(() => Role, { nullable: true }) role?: Role;
}
