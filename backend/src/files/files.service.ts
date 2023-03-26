import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFileDto } from './dto/create-file.dto';
import { File, FileDocument } from './schemas/file.schema';
import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name)
    private fileModel: Model<FileDocument>,
    private userService: UsersService,
  ) {}

  async create(createFileDto: CreateFileDto): Promise<FileDocument> {
    const createdFile = new this.fileModel(createFileDto);
    return createdFile.save();
  }

  async findById(fileId: string) {
    return this.fileModel.findById(fileId);
  }

  async findByOwner(owner: string) {
    return await this.fileModel.find({ owner }).exec();
  }

  async findShared(owner: string) {
    const files = await this.fileModel.find({ owner }).exec();
    const sharedFiles = [];
    files.forEach((element) => {
      if (element.authorizedUsers.length != 0) sharedFiles.push(element);
    });
    return sharedFiles;
  }
  async findFilesSharedToMe(owner: string) {
    const user = await this.userService.findById(owner);
    return await this.fileModel.find({ authorizedUsers: user._id }).exec();
  }

  async checkFile(fileId: string, userId: string) {
    const file = await this.fileModel.findById(fileId);
    const user = await this.userService.findById(userId);
    if (file) {
      if (file.owner._id.toString() === user._id.toString()) return true;
      else if (file.authorizedUsers.includes(user._id)) return true;
      else
        throw new UnauthorizedException(
          'You dont have acces to this resource.',
        );
    } else {
      throw new NotFoundException('File not found.');
    }
  }

  async fileShare(fileOwnerId: string, shareToId: string, fileId: string) {
    const file = await this.fileModel.findById(fileId);
    if (await this.checkFile(fileId, fileOwnerId)) {
      const user = await this.userService.findById(shareToId);
      if (!file.authorizedUsers.includes(user._id)) {
        if (user) {
          file.authorizedUsers.push(user);
          return this.fileModel
            .findByIdAndUpdate(fileId, file)
            .setOptions({ overwrite: true, new: true });
        } else {
          throw new NotFoundException('User not found.');
        }
      } else {
        throw new ForbiddenException(
          'This user already have access to this resoure.',
        );
      }
    }
  }
  async fileAccessRevoke(
    fileOwnerId: string,
    shareToId: string,
    fileId: string,
  ) {
    const file = await this.fileModel.findById(fileId);
    if (await this.checkFile(fileId, fileOwnerId)) {
      const user = await this.userService.findById(shareToId);
      if (user) {
        file.authorizedUsers = file.authorizedUsers.filter(
          (obj) => !user._id.equals(obj),
        );

        return this.fileModel
          .findByIdAndUpdate(fileId, file)
          .setOptions({ overwrite: true, new: true });
      } else {
        throw new NotFoundException('User not found.');
      }
    }
  }

  async imageStream(fileId: string, userId: string) {
    const file = await this.fileModel.findById(fileId);
    await this.checkFile(fileId, userId);

    return createReadStream(
      join(process.cwd(), 'upload', file.path, file.name),
    );
  }

  async imageBuffer(fileId: string, userId: string) {
    const file = await this.fileModel.findById(fileId);
    await this.checkFile(fileId, userId);

    return readFileSync(join(process.cwd(), 'upload', file.path, file.name));
  }
}
