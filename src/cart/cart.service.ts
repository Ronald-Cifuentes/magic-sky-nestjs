import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AbandonedCheckoutResult {
  id: string;
  createdAt: Date;
  customerName?: string | null;
  email?: string | null;
  region?: string | null;
  recoveryStatus: string;
  total: number;
  currency: string;
}

export interface AdminAbandonedCheckoutsResult {
  items: AbandonedCheckoutResult[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    let cart = await this.prisma.cart.findFirst({
      where: customerId ? { customerId } : { sessionId: sessionId || 'anon' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { take: 1, orderBy: { position: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          customerId: customerId || undefined,
          sessionId: sessionId || 'anon',
          currency: 'COP',
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { take: 1, orderBy: { position: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId, variantId },
      },
    });
    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { position: 'asc' } },
                },
              },
            },
          },
        },
      });
    }
    return this.prisma.cartItem.create({
      data: { cartId, variantId, quantity },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  async updateItem(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: cartItemId } });
      return null;
    }
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  async removeItem(cartItemId: string) {
    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return true;
  }

  async findAbandonedCheckouts(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    region?: string;
    recoveryStatus?: string;
  }): Promise<AdminAbandonedCheckoutsResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.CartWhereInput = {
      items: { some: {} },
    };

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { customer: { firstName: { contains: q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [carts, total] = await Promise.all([
      this.prisma.cart.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
          customer: { include: { user: true } },
        },
      }),
      this.prisma.cart.count({ where }),
    ]);

    const items: AbandonedCheckoutResult[] = carts.map((cart) => {
      let totalCents = 0;
      for (const item of cart.items) {
        totalCents += item.variant.price * item.quantity;
      }
      const customerName = cart.customer
        ? `${cart.customer.firstName} ${cart.customer.lastName}`.trim()
        : null;
      const email = (cart.customer as any)?.user?.email ?? null;
      return {
        id: cart.id,
        createdAt: cart.createdAt,
        customerName,
        email,
        region: 'Colombia',
        recoveryStatus: 'No recuperado',
        total: totalCents,
        currency: cart.currency,
      };
    });

    return { items, total, page, pageSize };
  }
}
