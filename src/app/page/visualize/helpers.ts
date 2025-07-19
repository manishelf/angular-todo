export function perf(op: string, row: Array<number>): number {
  let acc = (op==='MUL' || op === 'DIV') ? 1 : 0;
  for (let i = 0; i < row.length; i++) { 
    acc = perfOp(op, acc, row[i]);
  }
  if(op=='DIV') return 1/acc; // starts as 1/x/y
  return acc;
}

function perfOp(op: string, x: any, y:any){
    switch (op) {
      case 'SUM':
        return x + y;
      case 'DIFF':
        return x - y;
      case 'MUL':
        return x * y;
      case 'DIV':
        return x/y;
      default:
        return perfOp('SUM', x, y);
    }
}

function calculateMedian(data: number[]): number {
  if (data.length === 0) return NaN;
  const sortedData = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sortedData.length / 2);

  if (sortedData.length % 2 === 0) {
    // Even number of elements
    return (sortedData[mid - 1] + sortedData[mid]) / 2;
  } else {
    // Odd number of elements
    return sortedData[mid];
  }
}

function calculateMode(data: number[]): number[] {
  if (data.length === 0) return [NaN];
  const frequencyMap = new Map<number, number>();
  let maxFreq = 0;

  for (const num of data) {
    const count = (frequencyMap.get(num) || 0) + 1;
    frequencyMap.set(num, count);
    if (count > maxFreq) {
      maxFreq = count;
    }
  }

  const modes: number[] = [];
  for (const [num, freq] of frequencyMap.entries()) {
    if (freq === maxFreq) {
      modes.push(num);
    }
  }
  return modes;
}

export function reduceToFields(fields: string[], flatArr: [number, any[]][],op:string = 'SUM'): Map<string, number> {
  let res: Map<string, number> = new Map();
  let cols: Map<string, number[]> = new Map();
  
  for (let row of flatArr) {
    fields.forEach((field, i) => {
      let existing = res.get(field);
      let curr = Number.parseFloat(row[1][i+1]); // id is 0
      if (existing) {
        res.set(field, perfOp(op, existing, curr));
      } else {
        res.set(field, curr);
      }
      let col = cols.get(field);
      if(col){
       col.push(curr); 
      }else{
        cols.set(field, [curr]);
      }
    });
  }
  
  let newRes = res;
  
  switch(op){
    case 'MEAN':
      res.forEach((sum,field)=>{
        newRes.set(field, sum/cols.get(field)!.length);
      });
      break;
    case 'MEDIAN':
      cols.forEach((col, field)=>{
        newRes.set(field, calculateMedian(col));
      });
      break;
    case 'MODE':
      cols.forEach((col, field)=>{
        newRes.set(field, calculateMode(col)[0]);
      });
      break;
    case 'MIN':
      cols.forEach((col, field)=>{
        newRes.set(field, col.sort((x,y)=>x-y)[0]);
      });
      break;
    case 'MAX':
      cols.forEach((col, field)=>{
        newRes.set(field, col.sort((x,y)=>y-x)[0]);
      });
      break;
    case 'RANGE':
      cols.forEach((col, field)=>{
        newRes.set(field, col.sort((x,y)=>y-x)[0] - col.sort((x,y)=>x-y)[0]) // MAX-MIN
      });
  }
  return newRes;
}
