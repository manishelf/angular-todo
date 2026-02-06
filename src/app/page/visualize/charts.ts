import { TodoItem } from "../../models/todo-item";

declare var CanvasJS:any;
// copy pasta from https://canvasjs.com/

let canvasJsLoaded = false;
export function loadChartJS(canvasUrl: string){
  if(canvasJsLoaded) return;
  
  let canvScr = document.createElement('script');
  canvScr.src = canvasUrl;
  canvScr.async = true;
  canvScr.onerror = (e)=>{
    console.error('unable to load canvasjs!', e);
  }
  document.body.appendChild(canvScr);
  canvasJsLoaded = true;
}

export function drawPieChart(containerId: string, sumField: Map<string,number>){
    let dataPoints:{y:number, name:string, exploded: boolean}[] = [];
    let sum = 0;
    sumField.forEach((v, field)=>{
        sum+=v;
        dataPoints.push({y: v, name:field, exploded: true});
    });

    dataPoints.map((p)=>{
      p.y = Math.round(100 * (p.y/sum));
    });

    var chart = new CanvasJS.Chart(containerId, {
      theme: 'dark2',
      exportEnabled: true,
      animationEnabled: true,
      title:{
        text: 'Cumulative'
      },
      legend:{
        cursor: "pointer",
        itemclick: (e:any)=>{
          if(typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
          } else {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
          }
          e.chart.render();
        }
      },
      data: [{
        type: "pie",
        showInLegend: true,
        toolTipContent: "{name}: <strong>{y}%</strong>",
        indexLabel: "{name} - {y}%",
        dataPoints:dataPoints,
      }]
    });
    chart.render();
  }

export function drawBarChart(containerId: string, sumField: Map<string, number>){
    let dataPoints:{y:number, name:string, exploded: boolean}[] = [];
    sumField.forEach((v, field)=>{
        dataPoints.push({y: v, name:field, exploded: true});
    });

    var chart = new CanvasJS.Chart(containerId, {
    animationEnabled: true,
    exportEnabled: true,
    theme: "dark2",
    title:{
      text: "Cumulative"
    },
    legend:{
        cursor: "pointer",
      },
    data: [{        
      type: "column",  
      showInLegend: true, 
      toolTipContent: "{name}: <strong>{y}</strong>",
      indexLabel: "{name} - {y}",
      dataPoints: dataPoints
    }]
  });
  chart.render();

  }
  
export function drawLineChart(containerId: string, fields:string[], itemList:TodoItem[], reducedItemsFlat:[number, any[]][]){
    let data = [];
    let sum = 0;
    for(let i=0; i < fields.length ; i++){
        let dataPoints:any = [];
        reducedItemsFlat.forEach((row, j)=>{
            dataPoints.push({
                label: new Date(itemList[j].creationTimestamp).toLocaleString(),
                y: Number.parseFloat(row[1][i+1])
            });
            sum += Number.parseFloat(row[1][i+1]);
        });
        data.push({type:"spline", showInLegend: true, name:fields[i] ,toolTipContent: "{name}: <strong>{y}</strong>" , dataPoints});
    }
    let average = sum/(fields.length*reducedItemsFlat.length);
    
    var chart = new CanvasJS.Chart(containerId, {
      animationEnabled: true, 
      theme: "dark2", 
      exportEnabled: true,
      title:{
        text: `distribution`
      },
      toolTip: {
		    shared: "true",
	    },
      legend:{
		    cursor:"pointer",
		    itemclick : (e: any)=>{
            if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible ){
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            chart.render();
        }
    	},
      axisY: {
        title: '',
        stripLines: [{
          value: average,
          label: "Average"
        }]
      },
      data
    });
    chart.render();
  }