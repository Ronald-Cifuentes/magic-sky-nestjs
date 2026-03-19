import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}
