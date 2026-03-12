import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

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
}
