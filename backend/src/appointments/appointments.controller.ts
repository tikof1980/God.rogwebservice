import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { TenantActiveGuard } from '../common/tenant-active.guard';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('api/appointments')
@UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.companyId!, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointmentsService.findAll(user.companyId!, from, to);
  }

  @Get('today')
  findToday(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findToday(user.companyId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.companyId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user.companyId!, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(
      user.companyId!,
      id,
      dto.status,
      dto.amountPaid,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appointmentsService.remove(user.companyId!, id);
  }
}
