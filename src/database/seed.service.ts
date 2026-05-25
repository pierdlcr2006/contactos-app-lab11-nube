import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../modules/users/application/users.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const usersCount = await this.usersService.count();
    if (usersCount > 0) {
      return;
    }

    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@app.com',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'admin123',
    );
    const name = this.configService.get<string>('ADMIN_NAME', 'Administrador');
    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersService.createAdmin({ email, name, passwordHash });
    this.logger.log(`Admin inicial creado: ${email}`);
  }
}
