import { Resolver, Query, Args } from '@nestjs/graphql';
import { SettingsService } from './settings.service';

@Resolver()
export class SettingsResolver {
  constructor(private settings: SettingsService) {}

  @Query(() => String, { nullable: true })
  async siteSetting(@Args('key') key: string) {
    return this.settings.getByKey(key);
  }
}
