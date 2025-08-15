import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, AfterViewChecked, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import 'fabric-history';

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
 
    // undo redo 
    //https://github.com/alimozdemir/fabric-history
    this.modifyFabricForUndoRedo();
    this.fabricJsCanvas.historyInit();   

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
      this.fabricJsCanvas.isDrawingMode = !this.fabricJsCanvas.isDrawingMode;
    });
  }

  @HostListener('keyboard', ['$event'])
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

  modifyFabricForUndoRedo(){
    /**
     * Returns current state of the string of the canvas
     */
    fabric.Canvas.prototype._historyNext = function () {
      return JSON.stringify(this.toDatalessJSON(this.extraProps));
    };

    /**
     * Returns an object with fabricjs event mappings
     */
    fabric.Canvas.prototype._historyEvents = function () {
      return {
        'object:added': (e: any) => this._historySaveAction(e),
        'object:removed': (e: any) => this._historySaveAction(e),
        'object:modified': (e: any) => this._historySaveAction(e),
        'object:skewing': (e: any) => this._historySaveAction(e),
      };
    };

    /**
     * Initialization of the plugin
     */
    fabric.Canvas.prototype._historyInit = function () {
      this.historyUndo = [];
      this.historyRedo = [];
      this.extraProps = ['selectable', 'editable'];
      this.historyNextState = this._historyNext();

      this.on(this._historyEvents());
    };

    /**
     * Remove the custom event listeners
     */
    fabric.Canvas.prototype._historyDispose = function () {
      this.off(this._historyEvents());
    };

    /**
     * It pushes the state of the canvas into history stack
     */
    fabric.Canvas.prototype._historySaveAction = function (e:any) {
      if (this.historyProcessing) return;
      if (!e || (e.target && !e.target.excludeFromExport)) {
        const json = this._historyNext();
        this.historyUndo.push(json);
        this.historyNextState = this._historyNext();
        this.fire('history:append', { json: json });
      }
    };

    /**
     * Undo to latest history.
     * Pop the latest state of the history. Re-render.
     * Also, pushes into redo history.
     */
    fabric.Canvas.prototype.undo = function (callback: any) {
      // The undo process will render the new states of the objects
      // Therefore, object:added and object:modified events will triggered again
      // To ignore those events, we are setting a flag.
      this.historyProcessing = true;

      const history = this.historyUndo.pop();
      if (history) {
        // Push the current state to the redo history
        this.historyRedo.push(this._historyNext());
        this.historyNextState = history;
        this._loadHistory(history, 'history:undo', callback);
      } else {
        this.historyProcessing = false;
      }
    };

    /**
     * Redo to latest undo history.
     */
    fabric.Canvas.prototype.redo = function (callback: any) {
      // The undo process will render the new states of the objects
      // Therefore, object:added and object:modified events will triggered again
      // To ignore those events, we are setting a flag.
      this.historyProcessing = true;
      const history = this.historyRedo.pop();
      if (history) {
        // Every redo action is actually a new action to the undo history
        this.historyUndo.push(this._historyNext());
        this.historyNextState = history;
        this._loadHistory(history, 'history:redo', callback);
      } else {
        this.historyProcessing = false;
      }
    };

    fabric.Canvas.prototype._loadHistory = function (history: any, event: any, callback: any) {
      var that = this;

      this.loadFromJSON(history, function () {
        that.renderAll();
        that.fire(event);
        that.historyProcessing = false;

        if (callback && typeof callback === 'function') callback();
      });
    };

    /**
     * Clear undo and redo history stacks
     */
    fabric.Canvas.prototype.clearHistory = function () {
      this.historyUndo = [];
      this.historyRedo = [];
      this.fire('history:clear');
    };

    /**
     * On the history
     */
    fabric.Canvas.prototype.onHistory = function () {
      this.historyProcessing = false;

      this._historySaveAction();
    };

    /**
     * Check if there are actions that can be undone
     */

    fabric.Canvas.prototype.canUndo = function () {
      return this.historyUndo.length > 0;
    };

    /**
     * Check if there are actions that can be redone
     */
    fabric.Canvas.prototype.canRedo = function () {
      return this.historyRedo.length > 0;
    };

    /**
     * Off the history
     */
    fabric.Canvas.prototype.offHistory = function () {
      this.historyProcessing = true;
    };
  }

}
