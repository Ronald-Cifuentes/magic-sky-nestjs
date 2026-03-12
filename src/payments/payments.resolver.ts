import { Resolver, Query, Args } from '@nestjs/graphql';
import { PaymentsService } from './payments.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WompiCheckoutConfig {
  @Field() publicKey: string;
  @Field() reference: string;
  @Field() currency: string;
  @Field() amountInCents: number;
  @Field() integritySignature: string;
  @Field({ nullable: true }) redirectUrl?: string;
}

@Resolver()
export class PaymentsResolver {
  constructor(private payments: PaymentsService) {}

  @Query(() => WompiCheckoutConfig, { nullable: true })
  async wompiCheckoutConfig(@Args('orderId') orderId: string) {
    return this.payments.getWompiCheckoutConfig(orderId);
  }
}
