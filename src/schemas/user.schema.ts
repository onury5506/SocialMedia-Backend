import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { HydratedDocument, Types } from "mongoose";
import { Language } from "src/dto/translate.dto";
import { UserRoles } from "src/dto/user.dto";

@Schema({
    timestamps: true
})
export class User {
    @Prop()
    @ApiProperty()
    username: string;

    @Prop()
    @ApiProperty()
    name: string;

    @Prop()
    @ApiProperty()
    email: string;

    @Prop()
    @ApiProperty()
    password: string;

    @Prop()
    @ApiProperty()
    role: UserRoles;

    @Prop()
    @ApiProperty()
    profilePicture: string;

    @Prop()
    @ApiProperty()
    about: string;

    @Prop()
    @ApiProperty()
    language: Language;
    
    @Prop()
    @ApiProperty()
    followerCount: number;

    @Prop()
    @ApiProperty()
    followingCount: number;

    @Prop()
    @ApiProperty()
    postCount: number;
}

export type UserDocument = HydratedDocument<User>

export const UserSchema = SchemaFactory.createForClass(User);