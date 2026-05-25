import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Contact } from '../domain/contact.entity';

export type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string | null;
  notes?: string | null;
};

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  findAll(search?: string) {
    if (!search?.trim()) {
      return this.contactsRepository.find({ order: { createdAt: 'DESC' } });
    }

    const term = `%${search.trim()}%`;
    return this.contactsRepository.find({
      where: [
        { firstName: ILike(term) },
        { lastName: ILike(term) },
        { email: ILike(term) },
        { phone: ILike(term) },
        { company: ILike(term) },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const contact = await this.contactsRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Contacto no encontrado');
    }

    return contact;
  }

  async create(payload: ContactPayload) {
    this.validate(payload);
    const contact = this.contactsRepository.create(this.normalize(payload));
    return this.contactsRepository.save(contact);
  }

  async update(id: string, payload: ContactPayload) {
    const contact = await this.findOne(id);
    this.validate({ ...contact, ...payload });
    Object.assign(contact, this.normalize(payload));
    return this.contactsRepository.save(contact);
  }

  async remove(id: string) {
    const contact = await this.findOne(id);
    await this.contactsRepository.remove(contact);
    return { deleted: true };
  }

  private validate(payload: ContactPayload) {
    const requiredFields: Array<keyof ContactPayload> = [
      'firstName',
      'lastName',
      'email',
      'phone',
    ];

    for (const field of requiredFields) {
      if (!payload[field]?.trim()) {
        throw new BadRequestException(`El campo ${field} es obligatorio`);
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email ?? '')) {
      throw new BadRequestException('El correo no tiene un formato valido');
    }
  }

  private normalize(payload: ContactPayload) {
    return {
      firstName: payload.firstName?.trim(),
      lastName: payload.lastName?.trim(),
      email: payload.email?.trim().toLowerCase(),
      phone: payload.phone?.trim(),
      company: payload.company?.trim() || null,
      notes: payload.notes?.trim() || null,
    };
  }
}
