import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray } from 'class-validator';

@InputType()
export class UpdateSkinProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  skinType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  skinTone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  undertone?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  concerns?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  sensitivities?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  favoriteFinish?: string;
}
