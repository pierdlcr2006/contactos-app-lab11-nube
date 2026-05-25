import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  count() {
    return this.usersRepository.count();
  }

  createAdmin(data: Pick<User, 'email' | 'name' | 'passwordHash'>) {
    return this.usersRepository.save(
      this.usersRepository.create({ ...data, role: 'admin' }),
    );
  }
}
