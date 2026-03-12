import { Module } from '@nestjs/common';
import { LocalesService } from './locales.service';
import { LocalesResolver } from './locales.resolver';

@Module({
  providers: [LocalesService, LocalesResolver],
  exports: [LocalesService],
})
export class LocalesModule {}
