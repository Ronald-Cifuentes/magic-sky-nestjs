import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SkinProfile {
  @Field() id: string;
  @Field({ nullable: true }) skinType?: string;
  @Field({ nullable: true }) skinTone?: string;
  @Field({ nullable: true }) undertone?: string;
  @Field(() => [String]) concerns: string[];
  @Field(() => [String]) sensitivities: string[];
  @Field({ nullable: true }) favoriteFinish?: string;
}
