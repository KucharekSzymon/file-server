import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isNumberString } from 'class-validator';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  /**
   * Returns all users
   * @returns Array of all registered users
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  /**
   * Finding one specific user in database
   * @param id User unique id
   * @returns One user object that match provided id
   */
  async findById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id);
  }

  /**
   * Finding one specific user in database
   * @param email User unique email address
   * @returns One user object that match provided email
   */
  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Finds a specyfic user and replace his data with provided one
   * @param id User unique id
   * @param updateUserDto New user data
   * @returns User object with new data
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  /**
   * Remove one user witch id matches provided one
   * @param id User unique id
   * @returns Request to remove user from database
   */
  async remove(id: string, reqId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(reqId);
    if (user.isAdmin || user._id == id)
      return this.userModel.findByIdAndDelete(id).exec();
    else
      throw new UnauthorizedException('You dont have permission to do that!');
  }

  /**
   * Updates an amount of data user has stored on his account
   * @param userId user idectyficator
   * @param fileSize file size in bytes
   */
  async uploadOfFile(userId, fileSize) {
    const user = await this.userModel.findById(userId);
    user.storedData += fileSize;
    if (user.storageLimit <= user.storedData)
      throw new ForbiddenException(
        'Sorry, you have reached your storage limit. You have used up all the available space in your account. Free up some space by deleting files or asking administrator for more space.',
      );
    return this.userModel
      .findByIdAndUpdate(userId, user)
      .setOptions({ overwrite: true, new: true });
  }

  /**
   * Updates an amount of data user has stored on his account after file deletion
   * @param userId user idectyficator
   * @param fileSize file size in bytes
   */
  async removalOfFile(userId, fileSize) {
    const user = await this.userModel.findById(userId);

    user.storedData -= fileSize;
    if (user.storedData < 0) user.storedData = 0;
    return this.userModel
      .findByIdAndUpdate(userId, user)
      .setOptions({ overwrite: true, new: true });
  }

  /**
   * Admin function to change storage limit of user
   * @param userId user id
   * @param reqId administrator id
   * @param newStorageLimit newly set limit
   * @returns updated user object with new set limits
   */
  async updateStoragelimit(userId, reqId, newStorageLimit: number) {
    const user = await this.userModel.findById(userId);
    const requestor = await this.userModel.findById(reqId);
    if (user == null || requestor == null)
      throw new NotFoundException('User not found');
    if (!isNumberString(newStorageLimit))
      throw new BadRequestException('Provided value is not an number');

    user.storageLimit = newStorageLimit;
    return this.userModel
      .findByIdAndUpdate(userId, user)
      .setOptions({ overwrite: true, new: true });
  }

  /**
   * Function for checking user storage limits / how much user store / space left
   * @param userId User id
   * @param option 1 - Storage limit, 2 - Stored data, 3 - Space left
   * @returns
   */
  async storage(userId: string) {
    const user = await this.userModel.findById(userId);
    const data = {
      spaceLimit: user.storageLimit,
      spaceUsed: user.storedData,
      spaceLeft: user.storageLimit - user.storedData,
    };
    return data;
  }

  /**
   * Admin function for promoting / demoting another user to admin role
   * @param userId User identificator
   * @param isAdmin Sets user isAdmin property
   * @returns Updated user object with new set role
   */
  async changeRole(userId, isAdmin: boolean) {
    const user = await this.userModel.findById(userId);
    if (user == null) throw new NotFoundException('User not found');

    user.isAdmin = isAdmin;
    return this.userModel
      .findByIdAndUpdate(userId, user)
      .setOptions({ overwrite: true, new: true });
  }
}
