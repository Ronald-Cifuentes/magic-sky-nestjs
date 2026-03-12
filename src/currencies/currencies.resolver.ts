import { Resolver, Query, Args } from '@nestjs/graphql';
import { Float } from '@nestjs/graphql';
import { CurrenciesService } from './currencies.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CurrencyType {
  @Field() id: string;
  @Field() code: string;
  @Field() name: string;
  @Field() symbol: string;
  @Field() decimals: number;
}

@Resolver(() => CurrencyType)
export class CurrenciesResolver {
  constructor(private currenciesService: CurrenciesService) {}

  @Query(() => [CurrencyType])
  async currencies() {
    return this.currenciesService.findAll();
  }

  @Query(() => Float, { nullable: true })
  async exchangeRate(
    @Args('from') from: string,
    @Args('to') to: string,
  ) {
    return this.currenciesService.getExchangeRate(from, to);
  }
}
