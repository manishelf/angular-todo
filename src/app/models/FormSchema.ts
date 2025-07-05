export interface FormSchema {
    fields? : FormFields[],
}

export interface FormFields {
    name : string,
    label : string,
    type : 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PASSWORD' 
            | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'IMAGE' 
            | 'COLOR' | 'RANGE' | 'MONTH' | 'DATE' | 'TIME' | 'DATETIME-LOCAL',
    placeholder?: string,
    validation?: FormFieldValidation,
    default?: string,
    options?: string[],
}

export const inputTagTypes = [
     'TEXT', 'EMAIL' , 'PASSWORD' 
            , 'NUMBER' , 'DATE' , 
            , 'COLOUR' , 'COLOR' , 'RANGE' , 'MONTH' , 'DATE' , 'TIME' , 'DATETIME-LOCAL',
];

export interface FormFieldValidation{
    require? : boolean,
    minLength?: number,
    maxLength?: number,
    regexMatch? : string,
    min? : string,
    max? : string,
    step? : string,
}


