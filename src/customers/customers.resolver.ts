import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlCustomerGuard } from '../auth/guards/gql-customer.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CustomerProfile } from './entities/customer-profile.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateSkinProfileInput } from './dto/update-skin-profile.input';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class AdminCustomerType {
  @Field() id: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field(() => String, { nullable: true }) email?: string | null;
  @Field(() => String, { nullable: true }) phone?: string | null;
  @Field() totalSpent: number;
  @Field() totalOrders: number;
  @Field() createdAt: Date;
}

@ObjectType()
class AdminCustomersResultType {
  @Field(() => [AdminCustomerType]) items: AdminCustomerType[];
  @Field() total: number;
  @Field() page: number;
  @Field() pageSize: number;
}

@Resolver()
export class CustomersResolver {
  constructor(private customers: CustomersService) {}

  @Query(() => AdminCustomersResultType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCustomers(
    @Args('page', { nullable: true }) page?: number,
    @Args('pageSize', { nullable: true }) pageSize?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('sortBy', { nullable: true }) sortBy?: string,
    @Args('sortOrder', { nullable: true }) sortOrder?: string,
  ) {
    return this.customers.findAllPaginated({ page, pageSize, search, sortBy, sortOrder });
  }

  @Query(() => AdminCustomerType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCustomerById(@Args('id') id: string) {
    return this.customers.findById(id);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateCustomer(
    @Args('id') id: string,
    @Args('notes', { nullable: true }) notes?: string,
    @Args('tagsJson', { nullable: true }) tagsJson?: string,
  ) {
    const tags = tagsJson ? (JSON.parse(tagsJson) as string[]) : undefined;
    return this.customers.adminUpdateCustomer(id, { notes, tags });
  }

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
  async createAddress(
    @CurrentUser() user: User,
    @Args('input') input: CreateAddressInput,
  ) {
    return this.customers.createAddress(user.id, {
      address1: input.address1,
      address2: input.address2,
      city: input.city,
      province: input.province,
      countryCode: input.countryCode ?? 'CO',
      zip: input.zip,
      phone: input.phone,
    });
  }

  @Mutation(() => CustomerProfile, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async updateAddress(
    @CurrentUser() user: User,
    @Args('id') addressId: string,
    @Args('input') input: UpdateAddressInput,
  ) {
    return this.customers.updateAddress(user.id, addressId, {
      address1: input.address1,
      address2: input.address2,
      city: input.city,
      province: input.province,
      countryCode: input.countryCode,
      zip: input.zip,
      phone: input.phone,
    });
  }

  @Mutation(() => CustomerProfile, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlCustomerGuard)
  async setDefaultAddress(
    @CurrentUser() user: User,
    @Args('addressId') addressId: string,
  ) {
    return this.customers.setDefaultAddress(user.id, addressId);
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
