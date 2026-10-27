import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { mongo } from 'mongoose';
import { UserResponseDto, toUserResponse } from '../users/user-response.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.constants';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const BCRYPT_ROUNDS = 10;

// Compared against when the email is unknown, so a missing account takes as
// long to reject as a wrong password and can't be detected by timing.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.usersService.create({
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      });
      return toUserResponse(user);
    } catch (error) {
      // The unique index decides, so two simultaneous sign-ups can't both win.
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  /** Returns the user and a signed token, or 401 without saying which part was wrong. */
  async login(
    dto: LoginDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    const valid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, ver: user.tokenVersion ?? 0 };
    return {
      user: toUserResponse(user),
      token: await this.jwtService.signAsync(payload),
    };
  }

  /** Revokes the session behind `token`. Never throws: logging out always works. */
  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const { sub, ver } = await this.jwtService.verifyAsync<JwtPayload>(token);
      await this.usersService.revokeTokens(sub, ver ?? 0);
    } catch {
      // Expired or forged - nothing to revoke.
    }
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    // Token is valid but the account is gone.
    if (!user) throw new UnauthorizedException();
    return toUserResponse(user);
  }
}
