import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
    private clientsService: ClientsService,
  ) {}

  async create(companyId: string, dto: CreateAppointmentDto) {
    // Vérifie que le client appartient bien à l'entreprise (lève 404 sinon)
    await this.clientsService.findOne(companyId, dto.clientId);

    const appt = this.apptRepo.create({
      ...dto,
      companyId,
      startTime: new Date(dto.startTime),
      status: AppointmentStatus.PENDING,
    });
    return this.apptRepo.save(appt);
  }

  findAll(companyId: string, from?: string, to?: string) {
    if (from && to) {
      return this.apptRepo.find({
        where: { companyId, startTime: Between(new Date(from), new Date(to)) },
        order: { startTime: 'ASC' },
        relations: ['client'],
      });
    }
    return this.apptRepo.find({
      where: { companyId },
      order: { startTime: 'ASC' },
      relations: ['client'],
    });
  }

  /** Rendez-vous du jour — alimente le widget "rendez-vous du jour" du dashboard. */
  findToday(companyId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.findAll(companyId, start.toISOString(), end.toISOString());
  }

  async findOne(companyId: string, id: string) {
    const appt = await this.apptRepo.findOne({
      where: { id, companyId },
      relations: ['client'],
    });
    if (!appt) throw new NotFoundException('Rendez-vous introuvable.');
    return appt;
  }

  async update(companyId: string, id: string, dto: UpdateAppointmentDto) {
    const appt = await this.findOne(companyId, id);
    Object.assign(appt, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : appt.startTime,
    });
    return this.apptRepo.save(appt);
  }

  async updateStatus(
    companyId: string,
    id: string,
    status: AppointmentStatus,
    amountPaid?: number,
  ) {
    const appt = await this.findOne(companyId, id);
    appt.status = status;
    const saved = await this.apptRepo.save(appt);

    if (status === AppointmentStatus.COMPLETED) {
      await this.clientsService.registerVisit(
        companyId,
        appt.clientId,
        amountPaid ?? appt.estimatedPrice ?? 0,
      );
    }
    return saved;
  }

  async remove(companyId: string, id: string) {
    const appt = await this.findOne(companyId, id);
    await this.apptRepo.remove(appt);
  }

  /** Variante globale pour le scheduler de notifications (toutes entreprises actives). */
  async findAllPendingRemindersAcrossCompanies() {
    const upcoming = await this.apptRepo.find({
      where: { status: AppointmentStatus.CONFIRMED },
      relations: ['client', 'company'],
    });
    const now = Date.now();
    return upcoming
      .map((a) => {
        const diffH = (new Date(a.startTime).getTime() - now) / 3600000;
        let which: '24h' | '2h' | '30min' | null = null;
        if (diffH <= 24 && diffH > 2 && !a.reminder24hSent) which = '24h';
        else if (diffH <= 2 && diffH > 0.5 && !a.reminder2hSent) which = '2h';
        else if (diffH <= 0.5 && diffH > 0 && !a.reminder30minSent) which = '30min';
        return which ? { appointment: a, which } : null;
      })
      .filter((x): x is { appointment: Appointment; which: '24h' | '2h' | '30min' } => x !== null);
  }

  async markReminderSent(id: string, which: '24h' | '2h' | '30min') {
    const field =
      which === '24h'
        ? 'reminder24hSent'
        : which === '2h'
        ? 'reminder2hSent'
        : 'reminder30minSent';
    await this.apptRepo.update({ id }, { [field]: true });
  }

  /**
   * Rendez-vous confirmés dont le rappel correspondant n'a pas encore été
   * envoyé — utilisé par le futur scheduler de notifications (WhatsApp/SMS/push).
   */
  async findPendingReminders(companyId: string) {
    const upcoming = await this.apptRepo.find({
      where: { companyId, status: AppointmentStatus.CONFIRMED },
      relations: ['client'],
    });
    const now = Date.now();
    return upcoming.filter((a) => {
      const diffH = (new Date(a.startTime).getTime() - now) / 3600000;
      return (
        (diffH <= 24 && diffH > 2 && !a.reminder24hSent) ||
        (diffH <= 2 && diffH > 0.5 && !a.reminder2hSent) ||
        (diffH <= 0.5 && diffH > 0 && !a.reminder30minSent)
      );
    });
  }
}
