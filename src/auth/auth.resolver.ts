import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { LoginResponse, AdminLoginResponse, RefreshResponse } from './dto/auth-response.dto';
import { RegisterInput } from './dto/register.input';

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Mutation(() => LoginResponse)
  async register(@Args('input') input: RegisterInput) {
    return this.auth.registerCustomer(
      input.email,
      input.password,
      input.firstName,
      input.lastName,
    );
  }

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.auth.loginCustomer(email, password);
  }

  @Mutation(() => AdminLoginResponse)
  async adminLogin(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.auth.adminLogin(email, password);
  }

  @Mutation(() => RefreshResponse)
  async refreshSession(@Args('refreshToken') refreshToken: string) {
    return this.auth.refreshSession(refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Args('refreshToken', { nullable: true }) refreshToken?: string,
  ) {
    await this.auth.logout(refreshToken);
    return true;
  }

  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }
}
