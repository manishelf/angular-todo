import { FormSchema } from "./FormSchema";

export interface UserDefinedType {
    tag : string,
    formControlSchema : FormSchema,
    data : Map<string, string> | null,
}