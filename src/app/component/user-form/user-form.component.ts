import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
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


declare var fabric: any;

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

  fabricjsLoaded: boolean = false;

  canvasMap:Map<string, any> | null = null;

  state(): Map<string, any> {
    if (!this.schema?.fields) return new Map();

    if (this.dynamicForm?.valid) {
      let data = this.dynamicForm.value;
      if(this.canvasMap)
      for(let entry of this.canvasMap){
        data[entry[0]]=JSON.stringify(entry[1]?.toJSON());        
      }
      return data;
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

  @HostListener('focusin', ['$event'])
  onControlFocusIn(event: Event) {
    let target: HTMLElement = event.target as HTMLElement;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  createForm(): void {
    const formControls: { [key: string]: FormControl | FormArray } = {};
    if (this.schema && this.schema.fields) {
      for (let i = 0; i < this.schema.fields.length; i++) {
        const validators = [];
        const field: FormField = this.schema.fields[i];
        const type = field.type;
        const {
          require,
          readonly,
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
        if (pattern && type !== 'url') {
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
              (
                document.getElementById(
                  'editor-subject-input'
                ) as HTMLInputElement
              )?.value
            ),
            description: JSON.stringify(
              (
                document.getElementById(
                  'editor-description-input'
                ) as HTMLTextAreaElement
              )?.value
            ),
            formData: JSON.stringify(this.data),
          });
        }

        if(type === 'canvas') {
          if(!this.fabricjsLoaded){
            let script = document.createElement('script');
            script.src = '/fabric.min.js';
            script.async = true;
            script.onload = ()=>{
              this.initFabricjs(document.getElementById(field.name));
              
              if(document.getElementById(field.name+'_canvas_stroke_width')) return;

              this.schema?.fields?.splice(
                i+1,0,
                {
                  label:field.name+'_canvas_stroke_width',
                  name: field.name+'_canvas_stroke_width',
                  type:'range',
                  default: '1',
                  validation: {
                    min: '1',
                    max: '150',
                  }
                },
                {
                  label:field.name+'_canvas_stroke_color',
                  name: field.name+'_canvas_stroke_color',
                  type:'color',
                  default: '#0000'
                },
                {
                  label:field.name+'_canvas_size',
                  name: field.name+'_canvas_size',
                  type:'range',
                  default: '300',
                  validation: {
                    min: '300',
                    max: '1500'
                  }
                },
              );
            }
            document.body.appendChild(script);
            this.fabricjsLoaded = true;
          }
        }

        if (type === 'checkbox' && field.options) {
          let checkboxCtrls = field.options.map((option) => {
            const checked = (field.default || ['']).includes(option);
            return this.formBuilder.control(checked);
          });
          formControls[fieldName] = this.formBuilder.array(checkboxCtrls);
        } else {
          formControls[fieldName] = this.formBuilder.control(
            field.default,
            validators
          );
        }
      }
    }
    this.dynamicForm = this.formBuilder.group(formControls);
  }

  filterDuplicateFields() {
    if (!this.schema || !this.schema.fields) return;
    this.schema.fields;
    let uniqueFields = new Map<string, FormField>();
    for (const f of this.schema.fields) {
      uniqueFields.set(f.name, f);
    }
    this.schema.fields = Array.from(uniqueFields.values());
  }

  initFabricjs(canvasEle: HTMLElement | null){
    if(!canvasEle) return;

    //https://fabricjs.com/demos/free-drawing/
   
    const container = document.getElementById(canvasEle.id+'_container');
    container!.style.width = '50vw';
    container!.style.height = '50vh';
    let canvas = null;
    
    canvas = new fabric.Canvas(canvasEle, {
      isDrawingMode: true,
      width: container?.getBoundingClientRect().width,
      height: container?.getBoundingClientRect().height, 
    });
    if(this.data){
      let prevCanvas = this.data[canvasEle.id]; 
      if(prevCanvas){
        canvas.loadFromJSON(prevCanvas);
      }
    }
    if(this.canvasMap == null) {
      this.canvasMap = new Map();
    }
    
    this.canvasMap.set(canvasEle.id, canvas);

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    fabric.Object.prototype.transparentCorners = false;
    canvas.freeDrawingBrush.width = 1;
    canvas.backgroundColor = 'white';


    if(container){
      let containerResizeObserver = new ResizeObserver((entries)=>{
        const containerRect = entries[0].contentRect;
        canvas.setWidth(containerRect.width);
        canvas.setHeight(containerRect.height);
      });
      containerResizeObserver.observe(container);
      window.addEventListener('resize', (e) => {        
        const containerRect = container.getBoundingClientRect();
        canvas.setWidth(containerRect.width);
        canvas.setHeight(containerRect.height);
      });
    }
    

    setTimeout(()=>{ // allow the controls to be added
    let lineWidthCtrl = document.getElementById(canvasEle.id+'_canvas_stroke_width');
    let lineColorCtrl = document.getElementById(canvasEle.id+'_canvas_stroke_color');
    let canvasSizeCtrl = document.getElementById(canvasEle.id+'_canvas_size');
    

    if(lineColorCtrl && lineWidthCtrl && canvasSizeCtrl){
      let val = (lineColorCtrl as HTMLInputElement).value;
      canvas.freeDrawingBrush.color = val;
      val = (lineWidthCtrl as HTMLInputElement).value;
      canvas.freeDrawingBrush.width = parseInt(val, 10) || 1;
      
      lineColorCtrl.onchange = (e)=>{
        let val = (e?.target as HTMLInputElement).value;
        canvas.freeDrawingBrush.color = val;
      }
      lineWidthCtrl.onchange = (e)=>{
        let val = (e?.target as HTMLInputElement).value;
        canvas.freeDrawingBrush.width = parseInt(val, 10) || 1;
      }
      canvasSizeCtrl.onchange = (e)=>{
        let val = (e?.target as HTMLInputElement).value;
        let intVal = parseInt(val, 10) || 300;
        container!.style.height = intVal+'px';
        container!.style.width = intVal+'px';
        canvas.setWidth(intVal);
        canvas.setHeight(intVal);
        console.log(intVal, val);
      }
    }
    },1000);
  }
}
