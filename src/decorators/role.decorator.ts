import { SetMetadata } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const Role = (...roles: UserType[]) => SetMetadata('roles', roles);
