import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field() id: string;
  @Field() email: string;
  @Field() type: string;
}

@ObjectType()
export class LoginResponse {
  @Field() accessToken: string;
  @Field() refreshToken: string;
  @Field() expiresIn: number;
  @Field(() => AuthUser) user: AuthUser;
}

@ObjectType()
export class AdminLoginResponse {
  @Field() accessToken: string;
  @Field() refreshToken: string;
  @Field() expiresIn: number;
  @Field(() => AuthUser) user: AuthUser;
}

@ObjectType()
export class RefreshResponse {
  @Field() accessToken: string;
  @Field() refreshToken: string;
  @Field() expiresIn: number;
  @Field(() => AuthUser) user: AuthUser;
}
