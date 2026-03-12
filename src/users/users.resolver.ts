import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private users: UsersService) {}

  @ResolveField()
  async adminProfile(@Parent() user: User) {
    if (user.userType !== 'ADMIN') return null;
    const full = await this.users.findById(user.id);
    return full?.adminProfile ?? null;
  }

  @ResolveField()
  async customerProfile(@Parent() user: User) {
    if (user.userType !== 'CUSTOMER') return null;
    const full = await this.users.findById(user.id);
    return full?.customerProfile ?? null;
  }
}
