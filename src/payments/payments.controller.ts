import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('api/webhooks')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('wompi')
  async wompiWebhook(@Body() body: Record<string, unknown>) {
    const payload = body && typeof body === 'object' ? body : {};
    const ok = await this.payments.handleWompiWebhook(payload);
    return ok ? { received: true } : { received: false };
  }
}
