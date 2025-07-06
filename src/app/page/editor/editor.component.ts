import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import * as marked from 'marked';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BeanItemComponent } from '../../component/bean-item/bean-item.component';
import { TodoServiceService } from './../../service/todo-service.service';
import { TodoItem } from '../../models/todo-item';
import { Router } from '@angular/router';
import { Tag } from '../../models/tag';
import Prism from 'prismjs';
import { UserDefinedType } from '../../models/userdefined-type';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserFormComponent } from '../../component/user-form/user-form.component';
import { FormFields, FormSchema } from '../../models/FormSchema';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [FormsModule, CommonModule, MatIconModule, UserFormComponent],
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('subjectTxt') subjectTxt!: ElementRef;
  @ViewChild('userForm') userForm!: UserFormComponent;

  convertedMarkdown: string = '';
  option: string = 'MD Preview';
  tagNameList: string = '';
  forEdit: number = -1;
  showTags: boolean = false;
  schemaEditingInProgress: boolean = false;
  customFormSchema: FormSchema | undefined;

  todoItem: Omit<TodoItem, 'id'> = {
    subject: '',
    description: '',
    tags: [],
    completionStatus: false,
    setForReminder: false,
    creationTimestamp: new Date(Date.now()).toISOString(),
    updationTimestamp: new Date(Date.now()).toISOString(),
    userDefined: {
      tag: '',
      formControlSchema: {},
      data: null,
    },
  };

  constructor(
    private todoServie: TodoServiceService,
    private router: Router,
    private domSanitizer: DomSanitizer,
    private toaster: ToastService
  ) {
    if (router.url === '/edit') {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        let itemForUpdate = navigation.extras.state as TodoItem;
        this.forEdit = itemForUpdate.id;
        this.todoItem = itemForUpdate;
        this.todoItem.description = this.todoItem.description.replace(
          /<br>/g,
          '\n'
        );
        this.tagNameList = this.todoItem.tags.map((tag) => tag.name).join(',');
        this.customFormSchema = this.todoItem.userDefined?.formControlSchema;
      } else {
        router.navigate(['/home']);
      }
    }
    Prism.plugins['autoloader'].languages_path =
      'https://cdn.jsdelivr.net/npm/prismjs@1.14.0/components/';
  }

  ngAfterViewInit(): void {
    this.subjectTxt.nativeElement.focus();
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && event.target instanceof HTMLTextAreaElement) {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      target.value =
        target.value.substring(0, start) + '\t' + target.value.substring(end);
      target.selectionStart = target.selectionEnd = start + 1;
    } else if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault();
      this.onAddClick();
    } else if (
      event.key === 'Enter' &&
      event.target instanceof HTMLTextAreaElement
    ) {
      this.onEventForResize(event);
    } else if (event.key === 's' && event.ctrlKey) {
      event.preventDefault();
      this.onAddClick();
    }
  }
  @HostListener('focusin', ['$event'])
  onEventForResize(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    target.nextElementSibling?.scrollIntoView(true);
  }

  onOptionClick() {
    this.option = this.option === 'MD Preview' ? 'Editor' : 'MD Preview';
    if (this.option === 'Editor') {
      this.convertedMarkdown = marked
        .parse(this.todoItem.description)
        .toString();
      this.convertedMarkdown = this.convertedMarkdown.replaceAll('\n', '<br>');

      let code =
        this.convertedMarkdown.match(
          /<code class='language-(\w+)'>([\s\S]*?)<\/code>/g
        ) || this.convertedMarkdown.match(/<code>([\s\S]*?)<\/code>/);
      if (code) {
        for (let i = 0; i < code.length; i++) {
          let snippet = code[i];
          this.convertedMarkdown = this.convertedMarkdown.replace(
            snippet,
            snippet.replace(/<br>/g, '\n')
          );
        }
        setTimeout(() => {
          Prism.highlightAll();
        }, 100);
      }
      if (this.todoItem.subject.trim().length != 0) {
        this.convertedMarkdown =
          `<u class='text-3xl'>${this.todoItem.subject}</u><br>` +
          this.convertedMarkdown;
      }
    }
  }
  onAddClick() {
    if (this.userForm?.dynamicForm.invalid) {
      console.log('user defined field validation failed - ');
      console.error(this.userForm.state());
      this.userForm.state().forEach((value, key) => {
        if (value) {
          let stringy = JSON.stringify(value);
          this.toaster.error(key + '->' + stringy);
        }
      });
      return;
    }
    if (this.customFormSchema) {
      this.todoItem.userDefined = {
        tag: this.todoItem.tags
          .filter((tag) => tag.name.startsWith('form-'))
          .toString(),
        formControlSchema: this.customFormSchema,
        data: this.userForm.state(),
      };
    }
    if (this.forEdit !== -1) {
      this.todoServie.updateItem({ id: this.forEdit, ...this.todoItem });
    } else {
      this.todoServie.addItem(this.todoItem);
    }
    this.router.navigate(['/home']);
  }

  onUpdateTags(event: Event) {
    let inputValue = (event.target as HTMLInputElement).value;
    this.todoItem.tags = [];
    let tags = inputValue.split(',');
    tags.forEach((name) => {
      name = name.trim();
      if (name === '') return;

      if (name.startsWith('form-')) {
      }
      this.todoItem.tags.push({ name: name });
    });
    this.loadCustomSchemaFromDb(tags);
    this.tagNameList = this.todoItem.tags.map((tag) => tag.name).join(',');
  }

  onClickUserFormAdd(event: Event) {
    if (this.schemaEditingInProgress) {
      try {
        let formSchema = JSON.parse(this.todoItem.description);
        if (!formSchema.tag || !formSchema.formControlSchema) {
          this.toaster.error(
            'please provide a unique tag and schema for this shcema!'
          );
          return;
        }

        let tag = 'form-' + formSchema.tag;
        this.todoItem.tags.push({ name: tag });
        this.tagNameList = this.todoItem.tags.map((tag) => tag.name).join(',');
        this.todoServie.addCustom(tag, formSchema.formControlSchema);
        this.todoItem.description = localStorage['tempTodoDescription'];
        this.schemaEditingInProgress = false;
        return;
      } catch (e) {
        console.error('Error parsing schema - ');
        console.error(e);
        console.error('input schema - ', this.todoItem.description);
        this.toaster.error('error parsing the schema please try aggain');
        return;
      }
    }
    localStorage['tempTodoDescription'] = this.todoItem.description;
    this.todoItem.description = `/* Please add your json schema for desired custom form here - 
      * Remove this commented part before save; Dont wory your description will be back once you save the schema by clicking the same 'add custom form' button
      * the format is - 
      * {
      *   "tag" : string, 
      *   "formControlSchema" : {
      *     "fields": [
      *        {
      *         "name" : string,
      *         "label" : string,
      *         "type" : 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PASSWORD' 
      *                  | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'IMAGE' 
      *                  | 'COLOR' | 'RANGE' | 'MONTH' | 'DATE' | 'TIME' | 'DATETIME-LOCAL',
      *         "placeholder"?: string,
      *         "validation"?: {
      *             "require"? : boolean,
      *             "minLength"?: number,
      *             maxLength"?: number,
      *             regexMatch"? : string,
      *             "min"? : string,
      *             "max"? : string,
      *             "step"? : string
      *         },
      *         "default"?: string,
      *         "options"?: string[]
      *       }
      *     ]
      *   },
      *   "data" : Map<string, string> | null
      * }
      * 
      * sample - 
      *   {"tag":"sample", "formControlSchema": {"fields": [{"name":"sample", "label":"sample text", "type":"TEXT"}]}, "data":[["sample", "current value"]]}
      */\n\n\n
      `;
    if (this.todoItem.userDefined) {
      if (this.todoItem.userDefined.formControlSchema.fields) {
        this.todoItem.description += JSON.stringify(this.todoItem.userDefined);
      }
    }
    this.onEventForResize(event);
    this.schemaEditingInProgress = true;
  }

  loadCustomSchemaFromDb(tags: string[]) {
    this.customFormSchema = this.todoItem.userDefined?.formControlSchema;
      
    this.todoServie.getAllCustom(tags).subscribe((res) =>
      res.forEach((res) => {
        let schema = res.item;
        if (!schema) return;
        try {
          schema.fields?.forEach((field: FormFields) => {
            let data = this.todoItem.userDefined?.data;
            if (data) {
              data = new Map(Object.entries(data));
              let value = data.get(field.name);
              if (value) {
                field.default = value;
              }
            }
          });

          if (this.customFormSchema && this.customFormSchema.fields) {
            this.customFormSchema = {
              fields: [...this.customFormSchema.fields, ...schema.fields],
            };
          } else {
            this.customFormSchema = schema;
          }
        } catch (e) {
          console.error('failed to load schema ' + tags, schema, e);
        }
      })
    );
  }

  onClickTags() {
    this.showTags = !this.showTags;
  }
  onReminderClick() {
    this.todoItem.setForReminder = !this.todoItem.setForReminder;
  }

  onCompletionClick() {
    this.todoItem.completionStatus = !this.todoItem.completionStatus;
  }
}
