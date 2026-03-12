import { Module } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesResolver } from './currencies.resolver';

@Module({
  providers: [CurrenciesService, CurrenciesResolver],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
