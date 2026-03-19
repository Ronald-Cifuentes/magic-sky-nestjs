import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface DashboardStats {
  sessions: number;
  sessionsTrend: number;
  sessionsSparkline: number[];
  totalSales: number;
  totalSalesTrend: number;
  orders: number;
  ordersTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string): { from: Date; prevFrom: Date } {
    const now = new Date();
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '14d') days = 14;
    else if (period === '90d') days = 90;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);
    return { from, prevFrom };
  }

  async getDashboardStats(period: string = '30d', _channel?: string): Promise<DashboardStats> {
    const { from, prevFrom } = this.getDateRange(period);
    const now = new Date();

    const [ordersCurrent, ordersPrev, ordersAgg, cartsInPeriod] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: from, lte: now },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: prevFrom, lt: from },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: from, lte: now },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { total: true },
      }),
      this.prisma.cart.count({
        where: { createdAt: { gte: from, lte: now } },
      }),
    ]);

    const totalSales = ordersAgg._sum.total ?? 0;
    const totalSalesPrev = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: prevFrom, lt: from },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      _sum: { total: true },
    });

    const prevTotalSales = totalSalesPrev._sum.total ?? 0;

    const sessionsPrev = await this.prisma.cart.count({
      where: { createdAt: { gte: prevFrom, lt: from } },
    });
    const sessions = Math.max(ordersCurrent * 3, cartsInPeriod, 1);

    const sessionsTrend = sessionsPrev > 0 ? ((sessions - sessionsPrev) / sessionsPrev) * 100 : 0;

    const totalSalesTrend =
      prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    const ordersTrend = ordersPrev > 0 ? ((ordersCurrent - ordersPrev) / ordersPrev) * 100 : 0;

    const conversionRate = sessions > 0 ? (ordersCurrent / sessions) * 100 : 0;

    const prevConversion =
      sessionsPrev > 0 && ordersPrev > 0 ? (ordersPrev / sessionsPrev) * 100 : 0;
    const conversionRateTrend =
      prevConversion > 0 ? ((conversionRate - prevConversion) / prevConversion) * 100 : 0;

    const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '90d' ? 90 : 30;
    const sparkline: number[] = [];
    for (let i = 0; i < days; i += Math.max(1, Math.floor(days / 7))) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + Math.max(1, Math.floor(days / 7)));
      const c = await this.prisma.order.count({
        where: {
          createdAt: { gte: d, lt: next },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });
      sparkline.push(c);
    }

    return {
      sessions,
      sessionsTrend,
      sessionsSparkline: sparkline.length ? sparkline : [0],
      totalSales,
      totalSalesTrend,
      orders: ordersCurrent,
      ordersTrend,
      conversionRate,
      conversionRateTrend,
    };
  }
}
