import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { registerEnumType } from '@nestjs/graphql';
import { CmsPageDefinitionService } from './cms-page-definition.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { CmsPageKind, CmsSystemKey } from '@prisma/client';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsOptional, Allow } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

registerEnumType(CmsPageKind, { name: 'CmsPageKind' });
registerEnumType(CmsSystemKey, { name: 'CmsSystemKey' });

@ObjectType()
export class CmsPageDefinitionType {
  @Field() id: string;
  @Field() title: string;
  @Field() slug: string;
  @Field() routePath: string;
  @Field(() => CmsPageKind) pageKind: CmsPageKind;
  @Field(() => CmsSystemKey, { nullable: true }) systemKey: CmsSystemKey | null;
  @Field() published: boolean;
  @Field() deletable: boolean;
  @Field(() => GraphQLJSON) layoutJson: object;
  @Field(() => String, { nullable: true }) seoTitle: string | null;
  @Field(() => String, { nullable: true }) seoDescription: string | null;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class CmsComponentRegistryItem {
  @Field() type: string;
  @Field() version: number;
  @Field() label: string;
  @Field() category: string;
  @Field(() => [String]) allowedZones: string[];
  @Field(() => [String]) requiredData: string[];
  @Field(() => [String]) requiredContext: string[];
  @Field() canHaveChildren: boolean;
  @Field(() => [String]) childZones: string[];
}

@InputType()
export class CreateCmsPageInput {
  @Field() title: string;
  @Field() slug: string;
  @Field() routePath: string;
  @Field(() => CmsPageKind) pageKind: CmsPageKind;
  @Field(() => CmsSystemKey, { nullable: true }) systemKey?: CmsSystemKey | null;
  @Field({ nullable: true }) published?: boolean;
  @Field(() => GraphQLJSON)
  @Allow()
  layoutJson: object;
  @Field(() => String, { nullable: true }) seoTitle?: string | null;
  @Field(() => String, { nullable: true }) seoDescription?: string | null;
}

@InputType()
export class UpdateCmsPageInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Allow()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Allow()
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Allow()
  published?: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @Allow()
  layoutJson?: object;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Allow()
  seoTitle?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Allow()
  seoDescription?: string | null;
}

@Resolver()
export class CmsPageDefinitionResolver {
  constructor(private service: CmsPageDefinitionService) {}

  @Query(() => [CmsPageDefinitionType])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCmsPagesDetailed() {
    return this.service.findAll();
  }

  @Query(() => CmsPageDefinitionType, { nullable: true })
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCmsPageById(@Args('id') id: string) {
    return this.service.findById(id);
  }

  @Query(() => [CmsComponentRegistryItem])
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCmsComponentRegistry() {
    return this.service.getComponentRegistry();
  }

  @Query(() => CmsPageDefinitionType, { nullable: true })
  async cmsPageByRoute(@Args('routePath') routePath: string) {
    return this.service.findByRoute(routePath);
  }

  @Mutation(() => CmsPageDefinitionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminCreateCmsPage(@Args('input') input: CreateCmsPageInput) {
    return this.service.create(input as any);
  }

  @Mutation(() => CmsPageDefinitionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminUpdateCmsPage(@Args('id') id: string, @Args('input') input: UpdateCmsPageInput) {
    return this.service.update(id, input as any);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDeleteCmsPage(@Args('id') id: string) {
    return this.service.delete(id);
  }

  @Mutation(() => CmsPageDefinitionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDuplicateCmsPage(@Args('id') id: string) {
    return this.service.duplicate(id);
  }

  @Mutation(() => CmsPageDefinitionType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminSetCmsPublished(@Args('id') id: string, @Args('published') published: boolean) {
    return this.service.setPublished(id, published);
  }
}
