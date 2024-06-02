import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema()
export class Test {
    @Prop()
    name: string;
    @Prop()
    age: number;
}

export type TestDocument = HydratedDocument<Test>

export const TestSchema = SchemaFactory.createForClass(Test);