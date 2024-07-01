import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { HydratedDocument } from "mongoose";

@Schema({
    timestamps: true
})
export class Hashtag {
    @Prop()
    @ApiProperty()
    name: string;

    @Prop()
    @ApiProperty()
    postCount: number;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type HashtagDocument = HydratedDocument<Hashtag>

export const HashtagSchema = SchemaFactory.createForClass(Hashtag);

HashtagSchema.index({ name: 1 }, { unique: true });