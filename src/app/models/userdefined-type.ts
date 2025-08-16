import { FormSchema } from "./FormSchema";
import { Tag } from "./tag";

export interface UserDefinedType {
    tag : Tag,
    formControlSchema : FormSchema,
    data : Map<string, string> | null,
}