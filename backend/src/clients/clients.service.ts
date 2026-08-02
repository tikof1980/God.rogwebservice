import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private clientsRepo: Repository<Client>,
  ) {}

  create(companyId: string, dto: CreateClientDto) {
    const client = this.clientsRepo.create({ ...dto, companyId });
    return this.clientsRepo.save(client);
  }

  findAll(companyId: string) {
    return this.clientsRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(companyId: string, id: string) {
    const client = await this.clientsRepo.findOne({ where: { id, companyId } });
    if (!client) throw new NotFoundException('Client introuvable.');
    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    const client = await this.findOne(companyId, id);
    Object.assign(client, dto);
    return this.clientsRepo.save(client);
  }

  async remove(companyId: string, id: string) {
    const client = await this.findOne(companyId, id);
    await this.clientsRepo.remove(client);
  }

  /** Appelé après un rendez-vous marqué "terminé" pour mettre à jour l'historique. */
  async registerVisit(companyId: string, id: string, amountSpent = 0) {
    const client = await this.findOne(companyId, id);
    client.visitsCount += 1;
    client.totalSpent += amountSpent;
    client.loyaltyPoints += Math.floor(amountSpent / 1000); // 1 point / 1000 FCFA
    return this.clientsRepo.save(client);
  }
}
