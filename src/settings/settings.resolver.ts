import { Resolver, Query, Args } from '@nestjs/graphql';
import { SettingsService } from './settings.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ContactInfoType {
  @Field({ nullable: true }) whatsappUrl?: string;
  @Field({ nullable: true }) whatsappText?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) address?: string;
}

@Resolver()
export class SettingsResolver {
  constructor(private settings: SettingsService) {}

  @Query(() => String, { nullable: true })
  async siteSetting(@Args('key') key: string) {
    return this.settings.getByKey(key);
  }

  @Query(() => ContactInfoType)
  async contactInfo() {
    const keys = ['whatsapp_url', 'whatsapp_text', 'email', 'address'];
    const map = await this.settings.getMany(keys);
    return {
      whatsappUrl: map.whatsapp_url ?? null,
      whatsappText: map.whatsapp_text ?? null,
      email: map.email ?? null,
      address: map.address ?? null,
    };
  }
}
