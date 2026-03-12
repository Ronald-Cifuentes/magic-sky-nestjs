import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

export interface WompiCheckoutConfig {
  publicKey: string;
  reference: string;
  currency: string;
  amountInCents: number;
  integritySignature: string;
  redirectUrl?: string;
}

@Injectable()
export class WompiService {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const env = this.config.get('WOMPI_ENV', 'sandbox');
    this.baseUrl = env === 'production'
      ? 'https://production.wompi.co'
      : 'https://sandbox.wompi.co';
    this.publicKey = this.config.get('WOMPI_PUBLIC_KEY', '');
    this.privateKey = this.config.get('WOMPI_PRIVATE_KEY', '');
    this.integritySecret = this.config.get('WOMPI_INTEGRITY_SECRET', '');
  }

  generateIntegritySignature(reference: string, amountInCents: number, currency: string): string {
    const data = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async createCheckoutConfig(orderId: string): Promise<WompiCheckoutConfig | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || !this.publicKey) return null;

    const reference = order.wompiReference || `MS-${order.orderNumber}-${Date.now()}`;
    if (!order.wompiReference) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { wompiReference: reference },
      });
    }

    const payment = await this.prisma.payment.upsert({
      where: { reference },
      create: {
        orderId: order.id,
        reference,
        amount: order.total,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        provider: 'wompi',
      },
      update: {},
    });

    const signature = this.generateIntegritySignature(
      reference,
      order.total,
      order.currency,
    );

    return {
      publicKey: this.publicKey,
      reference,
      currency: order.currency,
      amountInCents: order.total,
      integritySignature: signature,
      redirectUrl: this.config.get('WOMPI_REDIRECT_URL', 'http://localhost:5173/checkout/complete'),
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<boolean> {
    const eventId = payload.event_id as string;
    const existing = await this.prisma.webhookLog.findFirst({
      where: { eventId, source: 'wompi' },
    });
    if (existing) return true;

    await this.prisma.webhookLog.create({
      data: {
        source: 'wompi',
        eventId,
        payload: payload as object,
      },
    });

    const data = payload.data as Record<string, unknown>;
    const reference = data?.reference as string;
    const status = data?.status as string;
    const transactionId = data?.transaction_id as string;

    if (!reference) return false;

    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { order: true },
    });
    if (!payment) return false;

    const newStatus = status === 'APPROVED' ? PaymentStatus.APPROVED : PaymentStatus.DECLINED;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        transactionId: transactionId || undefined,
        metadata: data as object,
      },
    });

    if (newStatus === PaymentStatus.APPROVED) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      });
    }

    await this.prisma.webhookLog.updateMany({
      where: { eventId, source: 'wompi' },
      data: { processed: true },
    });

    return true;
  }
}
