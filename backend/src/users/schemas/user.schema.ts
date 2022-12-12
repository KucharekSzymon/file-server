import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  /**
   * User first and last name
   */
  @Prop({ required: true })
  name: string;
  /**
   * User unique signing mail
   */
  @Prop({ required: true, unique: true })
  email: string;
  /**
   * User (mostly) hashed password
   */
  @Prop({ required: true })
  password: string;
  /**
   * User hashed autentication token
   */
  @Prop()
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);