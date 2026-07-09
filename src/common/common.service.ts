import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export class CommonService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async generateAuthTokens(user: Omit<User, 'hashedPassword'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const secret = uuidv4();

    const tokenId = await this.storeRefreshToken(secret, user.id);

    const refreshToken = `${tokenId}.${secret}`;

    return {
      access_token: accessToken,
      refresh_token: refreshToken, // send plain text to client
    };
  }

  async storeRefreshToken(secret: string, userId: string) {
    const REFRESH_TOKEN_EXPIRY_DAYS = 7;
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // multiply by 1000 to convert the entire thing in milliseconds
    );

    const hashedRefreshToken = await bcrypt.hash(secret, 10);
    const refreshTokenEntry = this.refreshTokenRepo.create({
      user: {
        id: userId,
      },
      hashedToken: hashedRefreshToken,
      expiresAt: expiresAt,
    });

    await this.refreshTokenRepo.save(refreshTokenEntry);

    return refreshTokenEntry.id;
  }
}
