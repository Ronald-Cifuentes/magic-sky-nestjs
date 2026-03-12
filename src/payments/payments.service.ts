import { Injectable } from '@nestjs/common';
import { WompiService } from './wompi/wompi.service';

@Injectable()
export class PaymentsService {
  constructor(private wompi: WompiService) {}

  async getWompiCheckoutConfig(orderId: string) {
    return this.wompi.createCheckoutConfig(orderId);
  }

  async handleWompiWebhook(payload: Record<string, unknown>) {
    return this.wompi.handleWebhook(payload);
  }
}
