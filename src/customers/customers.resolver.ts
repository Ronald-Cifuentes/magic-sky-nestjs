import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlCustomerGuard } from '../auth/guards/gql-customer.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CustomerProfile } from './entities/customer-profile.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateSkinProfileInput } from './dto/update-skin-profile.input';

@Resolver()
export class CustomersResolver {
  constructor(private customers: CustomersService) {}

  @Query(() => CustomerProfile, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async myProfile(@CurrentUser() user: User) {
    return this.customers.getProfile(user.id);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.customers.updateProfile(user.id, input);
  }

  @Mutation(() => CustomerProfile, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async updateSkinProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateSkinProfileInput,
  ) {
    await this.customers.updateSkinProfile(user.id, input);
    return this.customers.getProfile(user.id);
  }
}
