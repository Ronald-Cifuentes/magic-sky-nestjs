import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { GqlAdminGuard } from '../auth/guards/gql-admin.guard';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';

@ObjectType()
class AdminDashboardStatsType {
  @Field() sessions: number;
  @Field() sessionsTrend: number;
  @Field(() => [Int]) sessionsSparkline: number[];
  @Field() totalSales: number;
  @Field() totalSalesTrend: number;
  @Field() orders: number;
  @Field() ordersTrend: number;
  @Field() conversionRate: number;
  @Field() conversionRateTrend: number;
}

@Resolver()
export class AnalyticsResolver {
  constructor(private analytics: AnalyticsService) {}

  @Query(() => AdminDashboardStatsType)
  @UseGuards(GqlAuthGuard, GqlAdminGuard)
  async adminDashboardStats(
    @Args('period', { nullable: true }) period?: string,
    @Args('channel', { nullable: true }) channel?: string,
  ) {
    return this.analytics.getDashboardStats(period ?? '30d', channel);
  }
}
