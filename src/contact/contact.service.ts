import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface SubmitContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async submit(input: SubmitContactInput) {
    return this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
      },
    });
  }
}
