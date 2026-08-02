import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards';
import { TenantActiveGuard } from '../common/tenant-active.guard';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('api/clients')
@UseGuards(JwtAuthGuard, RolesGuard, TenantActiveGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.companyId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.findAll(user.companyId!);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clientsService.findOne(user.companyId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.companyId!, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clientsService.remove(user.companyId!, id);
  }
}
