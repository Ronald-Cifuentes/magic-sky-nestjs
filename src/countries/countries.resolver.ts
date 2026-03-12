import { Resolver, Query } from '@nestjs/graphql';
import { CountriesService } from './countries.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CountryType {
  @Field() id: string;
  @Field() code: string;
  @Field() name: string;
}

@Resolver(() => CountryType)
export class CountriesResolver {
  constructor(private countriesService: CountriesService) {}

  @Query(() => [CountryType])
  async countries() {
    return this.countriesService.findAll();
  }
}
