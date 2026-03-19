import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateEmailInput {
  @Field()
  @IsEmail({}, { message: 'Introduce un correo electrónico válido' })
  newEmail: string;

  @Field()
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida' })
  currentPassword: string;
}
