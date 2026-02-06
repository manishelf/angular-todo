import { FormSchema } from "./FormSchema";
import { Tag } from "./tag";

export interface UserDefinedType {
    tag : Omit<Tag,"id">,
    formControlSchema : FormSchema,
    data : Map<string, string> | null,
}