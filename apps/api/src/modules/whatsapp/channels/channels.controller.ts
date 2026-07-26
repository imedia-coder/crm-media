import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import { WHATSAPP_PERMISSIONS } from '../../../core/auth/permissions.constants';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('whatsapp/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @RequirePermissions(WHATSAPP_PERMISSIONS.CHANNELS_READ)
  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CHANNELS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.getOne(id);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CHANNELS_WRITE)
  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CHANNELS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.update(id, dto);
  }

  @RequirePermissions(WHATSAPP_PERMISSIONS.CHANNELS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelsService.remove(id);
  }
}
