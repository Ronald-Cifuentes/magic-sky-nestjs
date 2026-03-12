import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber() {
    return 'MS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  async createFromCart(cartId: string, email: string, shippingAddress: object, customerId?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new Error('Carrito vacío o no encontrado');
    }

    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const total = item.variant.price * item.quantity;
      subtotal += total;
      return {
        variantId: item.variantId,
        productTitle: item.variant.product?.title ?? 'Producto',
        variantTitle: item.variant.title,
        quantity: item.quantity,
        unitPrice: item.variant.price,
        totalPrice: total,
        sku: item.variant.sku,
      };
    });

    const orderNumber = this.generateOrderNumber();
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        email,
        status: OrderStatus.PENDING,
        subtotal,
        discountTotal: 0,
        shippingTotal: 0,
        taxTotal: 0,
        total: subtotal,
        currency: 'COP',
        shippingAddress: shippingAddress as object,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId } });

    return order;
  }

  async findByCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findAll(limit = 50) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
  }

  async findByNumber(orderNumber: string, customerId?: string) {
    const where: { orderNumber: string; customerId?: string } = { orderNumber };
    if (customerId) where.customerId = customerId;
    return this.prisma.order.findFirst({
      where,
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
  }
}
