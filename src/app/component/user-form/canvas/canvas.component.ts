import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, AfterViewChecked, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

declare var fabric: any;

@Component({
  selector: 'app-canvas',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent implements AfterViewInit {

  @Input({alias:'id', required: true}) id!: string;
  @Input({alias:'data'}) data!: string;
  editMode: boolean = false;
  fullScreen: boolean = false;

  @ViewChild('canvasEle') canvasEle!: ElementRef;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  strokeSize: number = 1;
  strokeColor: string = '#0000';
  canvasSize: number = 50;

  fabricJsCanvas: any;

  history: any[] = [];
  
  ngAfterViewInit(): void {
    if(!document.getElementById('fabricjs-script')){
      let script = document.createElement('script');
      script.src = '/fabric.min.js';
      script.id ='fabricjs-script'
      script.async = true;
      script.onload = ()=>{this.onLoadFabricJs()};
      document.body.appendChild(script);
    }else{
      this.initFabricJs();
    }
  }

  onLoadFabricJs(){
    this.initFabricJs();              
  }

  getState(): string{
    return JSON.stringify({
      ...this.fabricJsCanvas.toJSON(), 
      strokeSize: this.strokeSize, 
      strokeColor:this.strokeColor,
      canvasSize:this.canvasSize
    }); 
  }

  onStrokeColorChange(event: Event){
    this.fabricJsCanvas.freeDrawingBrush.color = this.strokeColor;
  }

  onStrokeSizeChange(event: Event){
    this.fabricJsCanvas.freeDrawingBrush.width = this.strokeSize;
  }

  onCanvasSizeChange(event: Event){
    this.canvasContainer.nativeElement.style.width = this.canvasSize + 'vw';
    this.canvasContainer.nativeElement.style.height =  this.canvasSize + 'vh';
  }

  initFabricJs(){
    //https://fabricjs.com/demos/free-drawing/
    this.fabricJsCanvas = new fabric.Canvas(this.id, {
      isDrawingMode: true,
      width: this.canvasEle?.nativeElement.getBoundingClientRect().width,
      height: this.canvasEle?.nativeElement.getBoundingClientRect().height, 
    });
 
    if(this.data){
      this.strokeColor = this.data
      this.fabricJsCanvas.loadFromJSON(this.data);
    }

    this.fabricJsCanvas.freeDrawingBrush = new fabric.PencilBrush(this.fabricJsCanvas);
    fabric.Object.prototype.transparentCorners = false;
    this.fabricJsCanvas.freeDrawingBrush.width = 1;
    this.fabricJsCanvas.backgroundColor = 'white';

    let ResizeHandler = new ResizeObserver((entry)=>{
      this.fabricJsCanvas.setHeight(entry[0].contentRect.height);
      this.fabricJsCanvas.setWidth(entry[0].contentRect.width);
    });
    setTimeout(
      ()=>ResizeHandler.observe(this.canvasContainer.nativeElement)
    ,1000);
  }

  addShapeToCanvas(shape: any){
    this.fabricJsCanvas.add(shape);
    this.fabricJsCanvas.setActiveObject(shape);
    this.fabricJsCanvas.isDrawingMode = !this.fabricJsCanvas.isDrawingMode;
  }

  addRect(){
    let rect = new fabric.Rect({
        left: 100,
        top: 50,
        fill: this.strokeColor,
        width: 200,
        height: 100,
        strokeWidth: 4,
      });
    this.addShapeToCanvas(rect);
  }

  addCircle(){
    let circle = new fabric.Circle({
          radius: 50,
          left: 275,
          top: 75,
          fill: this.strokeColor,
      });
    this.addShapeToCanvas(circle);
  }

  addTriangle(){
    let triangle = new fabric.Triangle({
        width: 100,
        height: 100,
        left: 50,
        top: 300,
        fill: this.strokeColor,
      });
    this.addShapeToCanvas(triangle);
  }
  addLine(){
    let line = new fabric.Polyline([
          { x: 10, y: 10 },
          { x: 100, y: 100 }
        ], {
        stroke: this.strokeColor,
        left: 100,
        top: 100
      });
    this.addShapeToCanvas(line);
  }

  addText(){
    let text = new fabric.Textbox('text', {
        left: 50,
        top: 10,
        width: 200,
        fontSize: 60,
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      });
    this.addShapeToCanvas(text);
  }

  addImage(){
    let url = prompt('Please enter the image url (link or data url)');    
    fabric.Image.fromURL(url, (img: any)=>{
    var imgCtrl = img.set({ left: 0, top: 0});
      this.fabricJsCanvas.add(imgCtrl); 
      this.fabricJsCanvas.setActiveObject(imgCtrl);
      this.fabricJsCanvas.renderAll(); 
      this.fabricJsCanvas.isDrawingMode = !this.fabricJsCanvas.isDrawingMode;
    });
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardEvents(event: KeyboardEvent){
    if(event.key === 'z' && event.ctrlKey){
      this.undoCanvas();
    }
    if(event.key === 'y' && event.ctrlKey){
      this.redoCanvas();
    }
  }

  undoCanvas(){
    this.fabricJsCanvas.undo();
  }

  redoCanvas(){
    this.fabricJsCanvas.redo();
  }

  clearCanvas(){
    this.fabricJsCanvas.clear();
  }

  copyToClipboardCanvas(){

  }
  
  toggleEditMode(){
    this.fabricJsCanvas.isDrawingMode = !this.fabricJsCanvas.isDrawingMode;
    this.editMode = !this.editMode;
  }
  
  toggleFullScreen(){
    this.fullScreen = !this.fullScreen;
    if(this.fullScreen){
      this.canvasContainer.nativeElement.style.width = '100vw';
      this.canvasContainer.nativeElement.style.height = '100vh';
      this.canvasContainer.nativeElement.style.position = 'absolute';
      this.canvasContainer.nativeElement.style.top = '0';
      this.canvasContainer.nativeElement.style.left = '0';
    }else{
      this.canvasContainer.nativeElement.style.width = '20vw';
      this.canvasContainer.nativeElement.style.height = '20vh';
      this.canvasContainer.nativeElement.style.position = 'relative';
    }
  }
}
