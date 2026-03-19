import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateAddressInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
