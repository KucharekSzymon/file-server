import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class CreateShareUrlDto {
  @ApiProperty()
  @IsMongoId()
  file: mongoose.Schema.Types.ObjectId;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  owner: mongoose.Schema.Types.ObjectId;

  @ApiProperty()
  expireTime: Date;
}