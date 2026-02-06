import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';

@Injectable({
  providedIn: 'root'
})
export class FilterOrReduceService {

  constructor() { }

  getReducedItems(properties: string[], items: TodoItem[]): [number, any[]][]{
    let resultMap:[number,any[]][] = [];
    for(let i =0; i<items.length; i++){
      let reducedObject:any = {};
      for(let prop of properties){
        reducedObject[prop]= (items[i] as any)[prop];
        if(reducedObject[prop] === undefined && items[i].userDefined?.data)
          reducedObject[prop] = (items[i].userDefined?.data as any)[prop];
      }
      let flatArr:any = [];
      properties.forEach(field => flatArr.push(reducedObject[field]));
      resultMap.push([items[i].id, flatArr]);
    }
    return resultMap;
  }
}
