import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface AdminOrdersResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

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

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
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
      include: { items: { include: { variant: { include: { product: true } } } }, customer: true, payments: true, shipments: true },
    });
  }

  async findAllPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: OrderStatus;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  }): Promise<AdminOrdersResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { customer: { firstName: { contains: q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (args.status) where.status = args.status;

    if (args.paymentStatus) {
      if (args.paymentStatus === 'paid' || args.paymentStatus === 'APPROVED') {
        where.payments = { some: { status: 'APPROVED' } };
      } else if (args.paymentStatus === 'unpaid' || args.paymentStatus === 'PENDING') {
        where.AND = [
          ...((where.AND as Prisma.OrderWhereInput[]) || []),
          {
            OR: [
              { payments: { none: {} } },
              { payments: { every: { status: { in: ['PENDING', 'DECLINED', 'ERROR'] } } } },
            ],
          },
        ];
      } else if (args.paymentStatus === 'cancelled') {
        where.status = OrderStatus.CANCELLED;
      }
    }

    if (args.fulfillmentStatus) {
      if (args.fulfillmentStatus === 'unfulfilled' || args.fulfillmentStatus === 'no_preparado') {
        where.AND = [
          ...((where.AND as Prisma.OrderWhereInput[]) || []),
          {
            OR: [
              { shipments: { none: {} } },
              { shipments: { every: { status: 'pending' } } },
            ],
          },
        ];
      } else if (args.fulfillmentStatus === 'fulfilled' || args.fulfillmentStatus === 'preparado') {
        where.AND = [
          ...((where.AND as Prisma.OrderWhereInput[]) || []),
          { shipments: { some: { status: { not: 'pending' } } } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          customer: true,
          payments: true,
          shipments: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Pedido no encontrado');
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        customer: true,
        payments: true,
        shipments: true,
      },
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

  async cancelOrderByCustomer(orderId: string, customerId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId: customerId },
    });
    if (!profile) throw new Error('Perfil no encontrado');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: profile.id },
    });
    if (!order) throw new Error('Pedido no encontrado');
    if (order.status === OrderStatus.CANCELLED) throw new Error('El pedido ya está cancelado');
    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Solo se pueden cancelar pedidos pendientes');
    }

    return this.updateStatus(orderId, OrderStatus.CANCELLED);
  }

  async adminDeleteOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');
    await this.prisma.order.delete({ where: { id: orderId } });
    return order;
  }
}
