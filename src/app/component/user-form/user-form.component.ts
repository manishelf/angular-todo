import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Tag } from '../../models/tag';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormSchema,
  FormFields,
  FormFieldValidation,
} from '../../models/FormSchema';
import { CommonModule } from '@angular/common';
import { inputTagTypes } from './../../models/FormSchema';
@Component({
  selector: 'app-user-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent implements OnChanges {
  inputTagTypes: (string | undefined)[];

  @Input() schema: FormSchema | undefined;
  @Input() data: any; 

  isValid: boolean = false;
  state(): Map<string, any> {
    if (!this.schema?.fields) return new Map();

    if (this.dynamicForm.valid) {
      return this.dynamicForm.value;
    } else {
      let errors = new Map();
      for (let i = 0; i < this.schema.fields.length; i++) {
        let control = this.dynamicForm.get(this.schema.fields[i].name);
        if (control) {
          errors.set(this.schema.fields[i].name, control.errors);
        }
      }
      return errors;
    }
  }

  dynamicForm!: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.inputTagTypes = inputTagTypes;
  }

  ngOnChanges(): void {
    if(this.data){
      let data = new Map(Object.entries(this.data));
      this.schema?.fields?.forEach(field=>{
        if(data.has(field.name))
          field.default = data.get(field.name) as string;
        });
    }
    this.createForm();
  }

  createForm(): void {
    console.log(this.schema);
    
    const formControls: { [key: string]: FormControl } = {};
    
    if (this.schema && this.schema.fields) {
      for (let i = 0; i < this.schema.fields.length; i++) {
        const validators = [];
        const {
          require,
          maxLength,
          minLength,
          min,
          max,
          regexMatch,
        }: FormFieldValidation = { ...this.schema.fields[i].validation };
        const fieldName: string = this.schema.fields[i].name;
        if (require) {
          validators.push(Validators.required);
        }
        if (maxLength) {
          validators.push(Validators.maxLength(maxLength));
        }
        if (minLength) {
          validators.push(Validators.minLength(minLength));
        }
        if (regexMatch) {
          validators.push(Validators.pattern(regexMatch));
        }
        formControls[fieldName] = new FormControl(
          this.schema.fields[i].default,
          validators
        );
      }
    }
    this.dynamicForm = this.formBuilder.group(formControls);
  }
}
