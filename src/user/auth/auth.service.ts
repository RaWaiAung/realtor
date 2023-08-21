import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignIn, SignUp } from '../types';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserType } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async signUp(
    { email, password, phone, name }: SignUp.SignUpParams,
    userType: UserType,
  ) {
    const isExistUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (isExistUser) {
      throw new ConflictException();
    }
    const hashPassword = await bcrypt.hash(password, 12);

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        phone,
        password: hashPassword,
        user_type: userType,
      },
    });

    const token = await this.generateToken(user.name, user.id);
    return token;
  }

  async signIn({ email, password }: SignIn.SignInParams) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', 400);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new HttpException('Invalid credentials', 400);
    }

    const token = await this.generateToken(user.name, user.id);
    return token;
  }

  private generateToken(name: string, id: number) {
    return jwt.sign(
      {
        name,
        id: id,
      },
      process.env.JWT_TOKEN,
      {
        expiresIn: 3600,
      },
    );
  }

  generateKey(email: string, userType: UserType) {
    const str = `${email}-${userType}-${process.env.PROCESS_KEY_SECRET}`;
    return bcrypt.hash(str, 12);
  }
}
