import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ContactService } from './contact.service';
import { SubmitContactInput } from './dto/submit-contact.input';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SubmitContactResponse {
  @Field() success: boolean;
  @Field() message: string;
}

@Resolver()
export class ContactResolver {
  constructor(private contact: ContactService) {}

  @Mutation(() => SubmitContactResponse)
  async submitContactMessage(@Args('input') input: SubmitContactInput) {
    await this.contact.submit(input);
    return {
      success: true,
      message: 'Tu mensaje ha sido enviado. Te responderemos pronto.',
    };
  }
}
