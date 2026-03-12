import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from '../products/entities/brand.entity';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../../auth/guards/gql-admin.guard';

@Resolver(() => Brand)
export class BrandsResolver {
  constructor(private brands: BrandsService) {}

  @Query(() => [Brand])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminBrands() {
    return this.brands.findAll();
  }
}
