import {
  Controller,
  Req,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  findOnlyMine(@Req() req) {
    return this.usersService.findById(req.user._id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post('promote/:id')
  promote(@Param('id') id: string) {
    return this.usersService.changeRole(id, true);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post('demote/:id')
  demote(@Param('id') id: string) {
    return this.usersService.changeRole(id, false);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Post('storageLimit')
  updateStorageLimit(@Req() req) {
    return this.usersService.updateStoragelimit(
      req.body.userId,
      req.user._id,
      req.body.newStorageLimit,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('spacelimit')
  getStorageLimit(@Req() req) {
    return this.usersService.storage(req.user._id, 1);
  }

  @UseGuards(AccessTokenGuard)
  @Get('spaceused')
  getStoredData(@Req() req) {
    return this.usersService.storage(req.user._id, 2);
  }

  @UseGuards(AccessTokenGuard)
  @Get('spaceleft')
  getSpaceLeft(@Req() req) {
    return this.usersService.storage(req.user._id, 3);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user._id);
  }
}
