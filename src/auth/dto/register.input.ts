import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
