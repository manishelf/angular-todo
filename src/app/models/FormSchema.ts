export interface FormSchema {
    fields? : FormField[],
}

export interface FormField {
    name : string,
    label : string,
    type : 'text' | 'textarea' | 'email' | 'password' 
            | 'number' | 'date' | 'select' | 'boolean' | 'image' | 'url'
            | 'color' | 'range' | 'month' | 'date' | 'time' | 'datetime-local' | 'history'
            | 'timestamp',
    placeholder?: string,
    validation?: FormFieldValidation,
    default?: string,
    options?: string[],
}

export const inputTagTypes = [
     'text', 'email' , 'password' 
            , 'number' , 'date' , 'url'
            , 'COLOUR' , 'color' , 'range' , 'month' , 'date' , 'time' , 'datetime-local'
];

export interface FormFieldValidation{
    require? : boolean,
    minLength?: number,
    maxLength?: number,
    pattern? : string,
    min? : string,
    max? : string,
    step? : string,
}


