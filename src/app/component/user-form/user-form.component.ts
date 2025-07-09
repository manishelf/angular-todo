import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Tag } from '../../models/tag';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormSchema,
  FormField,
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

    if (this.dynamicForm?.valid) {
      return this.dynamicForm.value;
    } else {
      let errors = new Map();
      for (let i = 0; i < this.schema.fields.length; i++) {
        let control = this.dynamicForm?.get(this.schema.fields[i].name);
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
    if (this.data) {
      let data = new Map(Object.entries(this.data));
      this.schema?.fields?.forEach((field) => {
        if (data.has(field.name))
          field.default = data.get(field.name) as string;
      });
    }
    this.createForm();
  }

  createForm(): void {
    const formControls: { [key: string]: FormControl | FormArray} = {};
    if (this.schema && this.schema.fields) {
      for (let i = 0; i < this.schema.fields.length; i++) {
        const validators = [];
        const field: FormField = this.schema.fields[i];
        const type = field.type;
        const {
          require,
          maxLength,
          minLength,
          min,
          max,
          pattern,
        }: FormFieldValidation = { ...field.validation };
        const fieldName: string = field.name;
        if (require) {
          validators.push(Validators.required);
        }
        if (maxLength) {
          validators.push(Validators.maxLength(maxLength));
        }
        if (minLength) {
          validators.push(Validators.minLength(minLength));
        }
        if (pattern) {
          validators.push(Validators.pattern(pattern));
        }
        if (max) {
          validators.push(Validators.max(Number.parseInt(max)));
        }
        if (min) {
          validators.push(Validators.min(Number.parseInt(min)));
        }
        if (type === 'email') {
          validators.push(Validators.email);
        }
        if (type === 'timestamp') {
          if (!field.default) {
            field.default = '';
          }
          field.default +=
            ' ,\n ' +
            Intl.DateTimeFormat([], {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date());
        }
        if (type === 'history') {
          if (!field.default) {
            field.default = '';
          }
          field.default += JSON.stringify({
            timestamp: Date(),
            subject: JSON.stringify(
              document.getElementById('editor-subject-input')?.innerHTML
            ),
            description: JSON.stringify(
              document.getElementById('editor-description-input')?.innerHTML
            ),
            formData: JSON.stringify(this.state()),
          });
        }
        if(type === 'checkbox' && field.options){
          let checkboxCtrls = field.options.map(option=>{
            const checked = (field.default || ['']).includes(option);
            return this.formBuilder.control(checked);
          });
          formControls[fieldName] = this.formBuilder.array(checkboxCtrls);
        }else {
          formControls[fieldName] = this.formBuilder.control(field.default, validators);
        }
      }
    }
    this.dynamicForm = this.formBuilder.group(formControls);
  }

  filterDuplicateFields() {
    if (!this.schema || !this.schema.fields) return;
    console.log(this.schema.fields);
    this.schema.fields;
    let uniqueFields = new Map<string, FormField>();
    for (const f of this.schema.fields) {
      uniqueFields.set(f.name, f);
    }
    this.schema.fields = Array.from(uniqueFields.values());
  }
}
