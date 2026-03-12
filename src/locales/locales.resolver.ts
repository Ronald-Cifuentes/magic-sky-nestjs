import { Resolver, Query } from '@nestjs/graphql';
import { LocalesService } from './locales.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class LocaleType {
  @Field() id: string;
  @Field() code: string;
  @Field() name: string;
  @Field() default: boolean;
}

@Resolver(() => LocaleType)
export class LocalesResolver {
  constructor(private localesService: LocalesService) {}

  @Query(() => [LocaleType])
  async locales() {
    return this.localesService.findAll();
  }
}
