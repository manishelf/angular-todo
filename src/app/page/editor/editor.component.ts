import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import * as marked from 'marked';
import { FormControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BeanItemComponent } from '../../component/bean-item/bean-item.component';
import { TodoServiceService } from '../../service/todo/todo-service.service';
import { TodoItem } from '../../models/todo-item';
import { ActivatedRoute, NavigationEnd, Router, TitleStrategy } from '@angular/router';
import { Tag } from '../../models/tag';
import { UserDefinedType } from '../../models/userdefined-type';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
} from '@angular/platform-browser';
import { UserFormComponent } from '../../component/user-form/user-form.component';
import { FormField, FormSchema, inputTagTypes } from '../../models/FormSchema';
import { ToastService } from 'angular-toastify';
import { filter, Observable } from 'rxjs';
import { TagListComponent } from '../../component/tag-list/tag-list.component';

declare var Prism: any;

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  imports: [FormsModule, CommonModule, MatIconModule, UserFormComponent, TagListComponent],
})
export class EditorComponent implements AfterViewChecked, AfterViewInit {
  
  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('subjectTxt') subjectTxt!: ElementRef;
  @ViewChild('descriptionArea') descriptionArea!: ElementRef;
  @ViewChild('lineNumbers') lineNumbers!: ElementRef;
  @ViewChild('userForm') userForm!: UserFormComponent;
  @ViewChild('tagInputArea') tagInputArea!: ElementRef;


  queryParams = {};

  convertedMarkdown: SafeHtml = '';
  option: string = 'Preview';
  forEdit: number = -1;
  showTags: boolean = false;
  schemaEditingInProgress: boolean = false;
  customFormSchema: FormSchema | undefined;
  customFormData: any;
  editiorLinesLoaded: boolean = false;

  onOptionDelayTimer: number = -1;
  leftIndentSpcaeCount: number = 0;


  todoItem: Omit<TodoItem, 'id'> = {
    subject: '',
    description: '',
    tags: [{ name: '*' }], //if no tag is added for a item then search by tags does not work correctly
    completionStatus: false,
    setForReminder: false,
    creationTimestamp: new Date(Date.now()).toISOString(),
    updationTimestamp: new Date(Date.now()).toISOString()
  };

  constructor(
    private todoServie: TodoServiceService,
    private router: Router,
    private domSanitizer: DomSanitizer,
    private toaster: ToastService,
    private route: ActivatedRoute,
  ) {
    if (this.router.url.startsWith('/edit')) {
      const navigation = this.router.getCurrentNavigation();
      this.route.queryParams.subscribe((params)=>{
        setTimeout(()=>{ // delay as the last item may not have updated just yet 
          let id = params['id'];
          let subject = params['subject'];
          id = Number.parseInt(id);
          if(id){
            this.todoServie.getItemById(id).subscribe((item)=>{
              this.forEdit = id;
              this.todoItem = item;
            });
            
          }else if(subject){
            this.todoServie.searchTodos(subject).subscribe((item)=>{
              this.forEdit = item[0].id;
              this.todoItem = item[0];
            });
          } 
        },100);
      });

      if (navigation?.extras?.state) {
        let itemForUpdate = navigation.extras.state['item'] as TodoItem;
        this.queryParams = navigation.extras.state['query'];     
        this.forEdit = itemForUpdate.id;
        this.todoItem = itemForUpdate;
        this.todoItem.description = this.todoItem.description.replace(
          /<br>/g,
          '\n'
        );
        this.customFormSchema = this.todoItem.userDefined?.formControlSchema;
        this.customFormData = this.todoItem.userDefined?.data;
      }
    }
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.subjectTxt.nativeElement.focus();
    }, 300);
    this.convertedMarkdown = '';
  }

  ngAfterViewChecked(): void {
    // called each time a child is updated
    // i.e on every letter typed in the textarea so a flag is needed
    // thankyou Phuoc Nguyen https://dev.to/phuocng/display-the-line-numbers-in-a-text-area-46mk
    if (this.editiorLinesLoaded) return;

    const textarea = this.descriptionArea?.nativeElement as HTMLTextAreaElement;
    const lineNumbersEle = this.lineNumbers?.nativeElement as HTMLElement;
    if (!(textarea || lineNumbersEle)) return;

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

    const parseValue = (v: any) =>
      v.endsWith('px') ? parseInt(v.slice(0, -2), 10) : 0;

    const font = `${textareaStyles.fontSize} ${textareaStyles.fontFamily}`;
    const paddingLeft = parseValue(textareaStyles.paddingLeft);
    const paddingRight = parseValue(textareaStyles.paddingRight);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) context.font = font;

    const calculateNumLines = (str: string) => {
      const textareaWidth =
        textarea.getBoundingClientRect().width - paddingLeft - paddingRight;
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
      lineNumbersEle.innerHTML = Array.from(
        {
          length: lineNumbers.length,
        },
        (_, i) => 
          `<div style="cursor:pointer"
             onmouseover="this.style.color = 'white'"
             onmouseout="this.style.color = '#39ff13'">
              ${lineNumbers[i] || '&nbsp;'}
            </div>`
      ).join('');
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

  handleKeydownForDescription(event: KeyboardEvent): void {
    
    const targetTextArea = event.target as HTMLTextAreaElement;
    const start = targetTextArea.selectionStart;
    const end = targetTextArea.selectionEnd;
    const sentenceStart = targetTextArea.value.substring(0,start);
    const sentenceEnd = targetTextArea.value.substring(end);

    if (event.key === 'Tab') {
      event.preventDefault();
      targetTextArea.value = sentenceStart + '\t' + sentenceEnd;
      targetTextArea.selectionStart = targetTextArea.selectionEnd = start + 1;

      if(sentenceStart.length == 0 || sentenceStart.match(/\n\t*$/)){ // zero or more tabs after nl
        this.leftIndentSpcaeCount+=1;
      }
      this.todoItem.description = targetTextArea.value;
    } else if (event.key === 'Enter') {
      if(this.leftIndentSpcaeCount>0 && sentenceStart.match(/\n*\t*$/)){ // zero or more tabs after nl
        event.preventDefault();
        targetTextArea.value=sentenceStart+'\n';
        for(let i = 0; i<this.leftIndentSpcaeCount; i++){
          targetTextArea.value+='\t';
        }
        targetTextArea.value+=sentenceEnd;
        targetTextArea.selectionStart = targetTextArea.selectionEnd = start + 1 + this.leftIndentSpcaeCount;
        this.todoItem.description = targetTextArea.value;
      }else{
        // alow natural line breaking and reset indentation
        this.leftIndentSpcaeCount = 0;
      }
      this.onEventForResize();
    }else if (event.key === 'Backspace'){
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const sentenceStart = target.value.substring(0,start);
      if(sentenceStart.match(/\n\t+$/)){ // one or more tabs after nl
        this.leftIndentSpcaeCount-=1;
        if(this.leftIndentSpcaeCount<0) this.leftIndentSpcaeCount = 0;
      }
      this.onEventForResize();
    }
     else if (event.key === 's' && event.ctrlKey) {
      event.preventDefault();
      this.onAddClick();
    } else if(event.key ==='[' && event.ctrlKey) {
      this.addChildItem();
    } else if(event.key === ']' && event.ctrlKey) {
      this.navigateToParent();
    }
  }

  handleKeydownForSubject(event: KeyboardEvent){
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onAddClick();
    }
  }

  addChildItem():void {
    let {id, ...childItem} = structuredClone((this.todoItem as any)); // clone the parent; it can contain id from save
    let name = `child of ${this.todoItem.subject}`;
    childItem.subject = '';
    childItem.description = '### ['+name+']';
    childItem.userDefined = undefined;
    childItem.tags.push({name});
    this.onAddClick(); 
    this.todoServie.addItem(childItem).then((id)=>{
      this.router.navigate(['/edit/child'],{state:{item:{id: id, ...childItem}, params: this.queryParams}, queryParams:{id}})
      .then((val)=>{
          setTimeout(()=>{
            this.subjectTxt.nativeElement.focus();
          },300);
        });
    });
  }

  navigateToParent(): void {
    this.todoServie.updateItem({id:this.forEdit, ...this.todoItem});
    let parentSubjectMatch = this.todoItem.description.match(/^### \[child of (.+?)\]/);
    if (parentSubjectMatch) {
      this.updateParentDescForTree();
      this.router.navigate(['/edit/parent'],{queryParams:{subject: parentSubjectMatch[1]}});
    }
    else {
       this.router.navigate(['/home'], {queryParams:this.queryParams});
    }
    setTimeout(()=>{
      this.descriptionArea?.nativeElement.focus();
      this.onEventForResize();
    }, 200);
  }

  createChildTreeview(parentSubject: string, hierarchy: Map<string, {item:TodoItem, children: Set<TodoItem>}>): string{
    let tree = '\n```treeview\n';
    tree += parentSubject+'/\n';
    let visited:string[] = [];
    for(let entry of hierarchy!.entries()){
      let i = 1;
      for(let child of entry[1].children){
        let icon = '├──';
        if(i == entry[1].children.size){
          icon = '└──';
        }
        if(!visited.includes(child.subject)){
          tree +=icon+' ['+child.subject+'](/edit?id='+child.id+')\n';
        }
        visited.push(child.subject);
        i++;
      }
    } 
    tree+='\n```\n';
    return tree;
  }

  updateParentDescForTree(){
    let parentSubjectMatch = this.todoItem.description.match(/^### \[child of (.+?)\]/);
    if(parentSubjectMatch){
      let replaceDesc = (parent:TodoItem, tree:string)=>{
          let existingTree = parent.description.match(new RegExp('\n```treeview\n'+parent.subject+'.*\n```\n','s'));
          if(existingTree){
            parent.description = parent.description.replace(new RegExp('\n```treeview\n'+parent.subject+'.*\n```\n','s'), tree); 
          }else{
            parent.description += tree;
          }
      }
      this.todoServie.searchTodos(parentSubjectMatch[1]).subscribe((res)=>{
        let parent = res[0];
        let hierarchy = new Map();
        this.todoServie.searchTodos('', ['child of '+parentSubjectMatch[1]], [], true).subscribe((children)=>{
          hierarchy?.set(this.todoItem.subject, {item: {id:this.forEdit, ...this.todoItem}, children: new Set(children)})
          let tree = this.createChildTreeview(parentSubjectMatch[1], hierarchy);
          replaceDesc(parent, tree);
          this.todoServie.updateItem(parent);
        });
      });
    }

  }
  
  @HostListener('focusin')
  onEventForResize(): void {
    if (this.descriptionArea) {
      const editorContainer = this.editorContainer.nativeElement;
      const descriptionArea = this.descriptionArea.nativeElement;

      const scrollBottom = editorContainer.scrollHeight - editorContainer.scrollTop;

      descriptionArea.style.height = 'auto';

      requestAnimationFrame(() => { // because setTimeout causes the text to jump up adn down
        descriptionArea.style.height = descriptionArea.scrollHeight + 'px';
        editorContainer.scrollTop = editorContainer.scrollHeight - scrollBottom;
      });
    }
  }
  
  @HostListener('paste', ['$event'])
  onPasteEvent(event: Event) {
    const descArea = event.target as HTMLTextAreaElement;
    let clipBoardData = (event as ClipboardEvent).clipboardData;
    let text = clipBoardData?.getData('text');

    if (
      text?.toLocaleLowerCase().startsWith('http://') ||
      text?.toLocaleLowerCase().startsWith('https://')
    ) {
      let cursorPosition = descArea.selectionStart;
      this.todoItem.description =
        this.todoItem.description.substring(0, cursorPosition) +
        `[link-${new Date().getSeconds()}](${text})` + 
    this.todoItem.description.substring(cursorPosition);
      event.preventDefault();
    }
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
            type: 'file',
            name:
              data.file.name.replaceAll(/[.]/g, '_') +
              '/' +
              new Date(data.file.lastModified).getSeconds(),
            label:
              data.file.name +
              '/' +
              new Date(data.file.lastModified).getSeconds(),
            default: 'file data',
            validation:{
              readonly: true,
            },
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
    setTimeout(()=>this.onEventForResize(),10);
  }

  onOptionClickOnDelayClearTimeout(){
    clearTimeout(this.onOptionDelayTimer);
  }

  onOptionClickOnDelay(event: Event){
    let selection = window.getSelection();
    if(selection && selection.toString().length > 0) {
        return;
    }

    const editorContainer = this.editorContainer.nativeElement;
    const scrollPercentage = editorContainer.scrollTop / editorContainer.scrollHeight;

    this.onOptionClickOnDelayClearTimeout();
    this.onOptionDelayTimer = setTimeout(()=>{
        this.onOptionClick();
        setTimeout(()=>{
          const newScrollTop = editorContainer.scrollHeight * scrollPercentage;
          editorContainer.scrollTop = newScrollTop;
        },50);
    }, 300);
  }

  onOptionClick() {
    this.onOptionClickOnDelayClearTimeout();

    if(this.todoItem.subject === '' && this.todoItem.description === ''){
      return;
    }  

    if (this.option == 'Preview') {
      this.editiorLinesLoaded = false;
      let markdown = marked.parse(this.todoItem.description).toString();

      let code =
        markdown.match(/<code class="language-(\w+)">([\s\S]*?)<\/code>/g) ||
        markdown.match(/<code>([\s\S]*?)<\/code>/);

        if (code) {
          for (let i = 0; i < code.length; i++) {
          let snippet = code[i];
          markdown = markdown.replace(snippet, snippet.replace(/<br>/g, '\n'));
        }
        setTimeout(() => {
          Prism.highlightAll();
        }, 200);
      }
      this.convertedMarkdown =
        this.domSanitizer.bypassSecurityTrustHtml(markdown);
      if (this.todoItem.subject.trim().length != 0) {
        this.convertedMarkdown = this.domSanitizer.bypassSecurityTrustHtml(markdown);
      }
    }else{
      setTimeout(()=>{
        this.onEventForResize()
      }, 5);
    }
    
    this.option = this.option === 'Preview' ? 'Editor' : 'Preview';
  }

  async onAddClick() {
    if (this.userForm?.dynamicForm.invalid) {
      console.log('user defined field validation failed - ');
      console.error(this.userForm.state());
      (await this.userForm.state() ).forEach((value, key) => {
        if (value) {
          let stringy = JSON.stringify(value);
          this.toaster.error(key + '->' + stringy);
        }
      });
      return;
    }
    if (this.customFormSchema?.fields) {
      this.todoItem.userDefined = {
        tag: {name:this.todoItem.tags.filter((tag) => tag.name.startsWith('form-')).map(tag => tag.name).join(',')},
        formControlSchema: this.customFormSchema,
        data: await this.userForm.state(),
      };
    }

    this.updateParentDescForTree();

    if (this.forEdit !== -1) {
      this.todoServie.updateItem({ id: this.forEdit, ...this.todoItem });
    } else {
      this.todoServie.addItem(this.todoItem);
    }

    this.router.navigate(['/home'], { queryParams: this.queryParams });
  }

  onUpdateTags(tags: Tag[]) {
    this.todoItem.tags = tags;
    this.loadCustomSchemaFromDb(tags);
    this.loadPrimitiveFields(tags);
  }

  loadPrimitiveFields(tags: Tag[]) {
    tags = tags.filter((tag) => tag.name.startsWith('form-'));
    if (tags.length === 0) return;
    this.customFormSchema = this.todoItem.userDefined?.formControlSchema;
    let fields: FormField[] = [];
    for (let i = 0; i < tags.length; i++) {
      let tagType = tags[i].name.substring(5);
      fields.push({
        name: tagType + '_' + i ,
        label: tagType + '_' + i ,
        type: tagType as FormField['type'],
        placeholder: '',
        default: '',
      }); 
    }
    this.appendCustomSchemaFields(fields);
  }

  loadCustomSchemaFromDb(tags: Tag[]) {
    tags = tags.filter((tag) => tag.name.startsWith('form-'));
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
          this.appendCustomSchemaFields(schema.fields);
        } catch (e) {
          console.error('failed to load schema ' + tags, schema, e);
        }
      })
    );
  }

  appendCustomSchemaFields(fields: FormField[]) {
    if (!fields || fields.length == 0) return;

    if (this.customFormSchema && this.customFormSchema.fields) {
      this.customFormSchema = {
        fields: [...this.customFormSchema.fields, ...fields],
      };
    } else {
      this.customFormSchema = { fields: fields };
    }
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

        let tag = 'form-' + formSchema.tag.trim();
        this.todoItem.tags.push({ name: tag });
        this.todoServie.addCustom(tag, formSchema.formControlSchema);

        if (this.customFormSchema && this.customFormSchema.fields) {
          this.customFormSchema = { // for angular to properly update ui. as only reference change is tracked.
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
    this.todoItem.description =
     `/* Please add your json schema for desired custom form here - 
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
      *                  | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'boolean' | 'image' | 'file' | 'canvas' 
      *                  | 'color' | 'range' | 'month' | 'date' | 'time' | 'datetime-local' | 'timestamp' | 'history',
      *         "placeholder"?: string,
      *         "validation"?: {
      *             "require"? : boolean,
      *             "readonly"?: any, // set any value for readonly control
      *             "minLength"?: number,
      *             maxLength"?: number,
      *             pattern"? : string,
      *             "min"? : string,
      *             "max"? : string,
      *             "step"? : string
      *         },
      *         "default"?: string,
      *         "options"?: string // , seperated options
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
		this.todoItem.description += JSON.stringify(
          this.todoItem.userDefined,
          null,
          4
        );
      }
    }

    this.onEventForResize();
    this.schemaEditingInProgress = true;
  }

  onReminderClick() {
    this.todoItem.setForReminder = !this.todoItem.setForReminder;
  }

  onCompletionClick() {
    this.todoItem.completionStatus = !this.todoItem.completionStatus;
  }
}
