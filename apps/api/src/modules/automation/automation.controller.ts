import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { AUTOMATION_PERMISSIONS } from '../../core/auth/permissions.constants';
import { AutomationService } from './automation.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Controller('automation/rules')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @RequirePermissions(AUTOMATION_PERMISSIONS.RULES_READ)
  @Get()
  findAll() {
    return this.automationService.findAll();
  }

  @RequirePermissions(AUTOMATION_PERMISSIONS.RULES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.automationService.findOneOrThrow(id);
  }

  @RequirePermissions(AUTOMATION_PERMISSIONS.RULES_WRITE)
  @Post()
  create(@Body() dto: CreateRuleDto) {
    return this.automationService.create(dto);
  }

  @RequirePermissions(AUTOMATION_PERMISSIONS.RULES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.automationService.update(id, dto);
  }

  @RequirePermissions(AUTOMATION_PERMISSIONS.RULES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.automationService.remove(id);
  }
}
