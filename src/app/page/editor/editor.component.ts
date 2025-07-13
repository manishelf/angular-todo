import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnChanges,
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
import { UserDefinedType } from '../../models/userdefined-type';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserFormComponent } from '../../component/user-form/user-form.component';
import { FormField, FormSchema } from '../../models/FormSchema';
import { ToastService } from 'angular-toastify';

declare var Prism: any;

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [FormsModule, CommonModule, MatIconModule, UserFormComponent],
})
export class EditorComponent implements AfterViewChecked, AfterViewInit {
  @ViewChild('subjectTxt') subjectTxt!: ElementRef;
  @ViewChild('descriptionArea') descriptionArea!: ElementRef;
  @ViewChild('lineNumbers') lineNumbers! : ElementRef;
  @ViewChild('userForm') userForm!: UserFormComponent;

  queryParams = {};

  convertedMarkdown: string = '';
  option: string = 'MD Preview';
  tagNameList: string = '';
  forEdit: number = -1;
  showTags: boolean = false;
  schemaEditingInProgress: boolean = false;
  customFormSchema: FormSchema | undefined;
  customFormData: any;
  editiorLinesLoaded:boolean =  false;

  todoItem: Omit<TodoItem, 'id'> = {
    subject: '',
    description: '',
    tags: [{name:'QtodoQ'}], //if no tag is added for a item then search by tags does not work correctly
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
      if (
        navigation &&
        navigation.extras &&
        navigation.extras.state &&
        navigation.extras.state
      ) {
        let itemForUpdate = navigation.extras.state['item'] as TodoItem;
        this.queryParams = navigation.extras.state['query'];
        this.forEdit = itemForUpdate.id;
        this.todoItem = itemForUpdate;
        this.todoItem.description = this.todoItem.description.replace(
          /<br>/g,
          '\n'
        );
        this.tagNameList = this.todoItem.tags.map((tag) => tag.name).join(',');
        this.customFormSchema = this.todoItem.userDefined?.formControlSchema;
        this.customFormData = this.todoItem.userDefined?.data;
      } else {
        router.navigate(['/home'], { queryParamsHandling: 'merge' });
      }
    }
  }

  ngAfterViewInit(): void{
    setTimeout(() => {
      this.subjectTxt.nativeElement.focus();
    }, 300);
  }

  ngAfterViewChecked(): void {
    // called each time a child is updated
    // i.e on every letter typed in the textarea so a flag is needed
    // thankyou Phuoc Nguyen https://dev.to/phuocng/display-the-line-numbers-in-a-text-area-46mk
    if(this.editiorLinesLoaded) return;
    
    const textarea = this.descriptionArea.nativeElement as HTMLTextAreaElement;
    const lineNumbersEle = this.lineNumbers.nativeElement as HTMLElement;

    const textareaStyles = window.getComputedStyle(textarea);
    [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'letterSpacing',
        'lineHeight',
        'padding',
    ].forEach((property: any) => {
        lineNumbersEle.style[property] = textareaStyles[property];
    });

    const parseValue = (v: any) => v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;

    const font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`;
    const paddingLeft = parseValue(textareaStyles.paddingLeft);
    const paddingRight = parseValue(textareaStyles.paddingRight);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if(context)
    context.font = font;

    const calculateNumLines = (str: string) => {
        const textareaWidth = textarea.getBoundingClientRect().width - paddingLeft - paddingRight;
        const words = str.split(' ');
        let lineCount = 0;
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
            const wordWidth = context?.measureText(words[i] + ' ').width || 0;
            const lineWidth = context?.measureText(currentLine).width || 0;

            if (lineWidth + wordWidth > textareaWidth) {
                lineCount++;
                currentLine = words[i] + ' ';
            } else {
                currentLine += words[i] + ' ';
            }
        }

        if (currentLine.trim() !== '') {
            lineCount++;
        }

        return lineCount;
    };

    const calculateLineNumbers = () => {
        const lines = textarea.value.split('\n');
        const numLines = lines.map((line) => calculateNumLines(line));

        let lineNumbers = [];
        let i = 1;
        while (numLines.length > 0) {
            const numLinesOfSentence = numLines.shift() || 0;
            lineNumbers.push(i);
            if (numLinesOfSentence > 1) {
                Array(numLinesOfSentence - 1)
                    .fill('')
                    .forEach((_) => lineNumbers.push(''));
            }
            i++;
        }

        return lineNumbers;
    };

    const displayLineNumbers = () => {
        const lineNumbers = calculateLineNumbers();
        lineNumbersEle.innerHTML = Array.from({
            length: lineNumbers.length
        }, (_, i) => `<div>${lineNumbers[i] || '&nbsp;'}</div>`).join('');
    };

    textarea.addEventListener('input', () => {
        displayLineNumbers();
    });

    displayLineNumbers();

    const ro = new ResizeObserver(() => {
        const rect = textarea.getBoundingClientRect();
        lineNumbersEle.style.height = `${rect.height}px`;
        displayLineNumbers();
    });
    ro.observe(textarea);

    textarea.addEventListener('scroll', () => {
        lineNumbersEle.scrollTop = textarea.scrollTop;
    });

    this.editiorLinesLoaded = true;
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

  @HostListener('paste', ['$event'])
  onPasteEvent(event: Event) {
    const descArea = event.target as HTMLTextAreaElement;
    let clipBoardData = (event as ClipboardEvent).clipboardData;
    interface data {
      file: File;
      reader: FileReader;
    }
    let DecodeItem = new Promise<data>((resolve) => {
      for (let item of clipBoardData?.items || []) {
        if (item.kind.startsWith('file')) {
          let blob = item.getAsFile();
          let file = item.getAsFile();
          if (blob && file) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            resolve({ file, reader });
          }
        }
      }
    });

    DecodeItem.then((data) => {
      data.reader.onload = (event: Event) => {
        let target: any = event.target;
        if (target.result) {
          let field: FormField = {
            type: 'url',
            name: data.file.name.replaceAll(/[.]/g, '_')+'/'+new Date(data.file.lastModified).getSeconds(),
            label: data.file.name+'/'+new Date(data.file.lastModified).getSeconds(),
            default: 'file data',
          };
          if (data.file.type.startsWith('image')) {
            field.type = 'image';
          }
          if (this.customFormSchema && this.customFormSchema.fields) {
            this.customFormSchema.fields = [
              ...this.customFormSchema.fields,
              field,
            ];
          } else {
            this.customFormSchema = { fields: [field] };
          }
          let formData: any = {};
          formData[field.name] = target.result;
          this.customFormData = { ...this.customFormData, ...formData };
          const cursorPosition = descArea.selectionStart;
          this.todoItem.description =
            this.todoItem.description.substring(0, cursorPosition) +
            ' #Ref:' +
            field.label +
            ' ' +
            this.todoItem.description.substring(cursorPosition);
        }
      };
    });
    this.onEventForResize(event);
  }

  onOptionClick() {
    this.option = this.option === 'MD Preview' ? 'Editor' : 'MD Preview';
    if (this.option === 'Editor') {
      this.editiorLinesLoaded = false;

      this.convertedMarkdown = marked
        .parse(this.todoItem.description)
        .toString();
      this.convertedMarkdown = this.convertedMarkdown.replaceAll('\n\n', '<br>');

      let code =
        this.convertedMarkdown.match(
          /<code class="language-(\w+)">([\s\S]*?)<\/code>/g
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
        }, 200); 
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
        tag: JSON.stringify(
          this.todoItem.tags.filter((tag) => tag.name.startsWith('form-'))
        ),
        formControlSchema: this.customFormSchema,
        data: this.userForm.state(),
      };
    }

    if (this.forEdit !== -1) {
      this.todoItem.updationTimestamp = new Date(Date.now()).toISOString();
      this.todoServie.updateItem({ id: this.forEdit, ...this.todoItem });
    } else {
      this.todoServie.addItem(this.todoItem);
    }
    this.router.navigate(['/home'], { queryParams: this.queryParams });
  }

  onUpdateTags(event: Event) {
    let inputValue = (event.target as HTMLInputElement).value;
    this.todoItem.tags = [];
    let tags = inputValue.split(',');
    tags.forEach((name) => {
      this.todoItem.tags.push({ name: name.trim() });
    });
    this.loadCustomSchemaFromDb(tags);
    this.tagNameList = this.todoItem.tags.map((tag) => tag.name).join(',');
  }

  loadCustomSchemaFromDb(tags: string[]) {
    tags = tags.filter((tag) => tag.startsWith('form-'));
    if (tags.length === 0) return;

    this.customFormSchema = this.todoItem.userDefined?.formControlSchema;

    this.todoServie.getAllCustom(tags).subscribe((resultArray) =>
      resultArray.forEach((res) => {
        let schema = res?.item;
        if (!schema) return;
        try {
          schema.fields?.forEach((field: FormField) => {
            let data = this.customFormData;
            if (data) {
              data = new Map(Object.entries(data));
              let value = data.get(field.name);
              if (value) {
                field.default = value;
              }
            }
          });

          if (this.customFormSchema && this.customFormSchema.fields) {
            // have to do this instead of push as push is not tracked
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

  onClickUserFormAdd(event: Event) {
    if (this.schemaEditingInProgress) {
      try {
        //first remove comments
        this.todoItem.description = this.todoItem.description
          .replaceAll(/\/\*[\s\S]*?\*\//g, '')
          .replaceAll(/\/\/.*$/gm, '');

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

        if (this.customFormSchema && this.customFormSchema.fields) {
          this.customFormSchema = {
            fields: [
              ...this.customFormSchema.fields,
              ...formSchema.formControlSchema.fields,
            ],
          };
        } else {
          this.customFormSchema = formSchema.formControlSchema;
        }

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
      * Remove this commented part before save; Dont worry your description will be back once you save the schema by clicking the same 'add custom form' button
      * the format is - 
      * {
      *   "tag" : string, 
      *   "formControlSchema" : {
      *     "fields": [
      *        {
      *         "name" : string,
      *         "label" : string,
      *         "type" : 'text' | 'textarea' | 'email' | 'password' 
      *                  | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'boolean' | 'image' 
      *                  | 'color' | 'range' | 'month' | 'date' | 'time' | 'datetime-local' | 'timestamp' | 'history',
      *         "placeholder"?: string,
      *         "validation"?: {
      *             "require"? : boolean,
      *             "minLength"?: number,
      *             maxLength"?: number,
      *             pattern"? : string,
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
      *   {"tag":"sample", "formControlSchema": {"fields": [{"name":"sample", "label":"sample text", "type":"text"}]}, "data":[["sample", "current value"]]}\n*/\n\n\n`;
    if (this.todoItem.userDefined) {
      if (this.todoItem.userDefined.formControlSchema.fields) {
        // undo the form- prefix for convienience
        this.todoItem.userDefined.tag = this.todoItem.userDefined.tag.replace(
          'form-',
          ''
        );
        this.todoItem.description += JSON.stringify(
          this.todoItem.userDefined,
          null,
          4
        );
      }
    }

    this.onEventForResize(event);
    this.schemaEditingInProgress = true;
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
