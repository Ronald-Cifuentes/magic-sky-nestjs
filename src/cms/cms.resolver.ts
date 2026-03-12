import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { ObjectType, Field } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';

@ObjectType()
export class CmsPageType {
  @Field() id: string;
  @Field() slug: string;
  @Field() title: string;
  @Field({ nullable: true }) content?: string;
  @Field() published: boolean;
}

@ObjectType()
export class CmsSectionType {
  @Field() id: string;
  @Field() type: string;
  @Field(() => String) content: string;
  @Field() sortOrder: number;
}

@ObjectType()
export class HeroBannerType {
  @Field() id: string;
  @Field({ nullable: true }) title?: string;
  @Field({ nullable: true }) subtitle?: string;
  @Field({ nullable: true }) imageUrl?: string;
  @Field({ nullable: true }) linkUrl?: string;
  @Field() sortOrder: number;
}

@ObjectType()
export class AnnouncementBarType {
  @Field() id: string;
  @Field() text: string;
  @Field({ nullable: true }) linkUrl?: string;
}

@Resolver()
export class CmsResolver {
  constructor(private cms: CmsService) {}

  @Query(() => CmsPageType, { nullable: true })
  async cmsPageBySlug(@Args('slug') slug: string) {
    return this.cms.getPageBySlug(slug);
  }

  @Query(() => [HeroBannerType])
  async heroContent() {
    return this.cms.getHeroContent();
  }

  @Query(() => AnnouncementBarType, { nullable: true })
  async announcementBar() {
    return this.cms.getAnnouncementBar();
  }

  @Query(() => [CmsPageType])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCmsPages() {
    return this.cms.getAllPages();
  }
}
