import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { HydratedDocument, Types } from "mongoose";

@Schema()
export class Test {
    @ApiProperty()
    _id: Types.ObjectId;

    @ApiProperty()
    _v: number;
    
    @Prop()
    @ApiProperty()
    name: string;

    @Prop()
    @ApiProperty()
    age: number;
}

export type TestDocument = HydratedDocument<Test>

export const TestSchema = SchemaFactory.createForClass(Test);