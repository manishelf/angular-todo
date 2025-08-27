export interface FormSchema {
    fields? : FormField[],
}

export interface FormField {
    name : string,
    label : string,
    type : 'text' | 'textarea' | 'email' | 'password' 
            | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'boolean' | 'image' | 'url'
            | 'color' | 'range' | 'month' | 'date' | 'time' | 'datetime-local' | 'history' | 'canvas' 
            | 'timestamp' | 'file',
    placeholder?: string,
    validation?: FormFieldValidation,
    default?: string,
    options?: string,
}

export const inputTagTypes = [
     'text', 'email' , 'password' 
            , 'number' , 'date' , 'url'
            , 'color' , 'range' , 'month' , 'date' , 'time' , 'datetime-local'
];

export interface FormFieldValidation{
    require? : boolean,
    readonly?: boolean,
    minLength?: number,
    maxLength?: number,
    pattern? : string,
    min? : string,
    max? : string,
    step? : string,
}


