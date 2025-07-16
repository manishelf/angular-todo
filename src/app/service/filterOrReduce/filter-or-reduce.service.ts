import { Injectable } from '@angular/core';
import { TodoItem } from '../../models/todo-item';

@Injectable({
  providedIn: 'root'
})
export class FilterOrReduceService {

  constructor() { }

  getReducedItems(properties: string[], items: TodoItem[]): Map<number, any>{
    let resultMap = new Map<number, string>();
    for(let i =0; i<items.length; i++){
      let reducedObject:any = {};
      for(let prop of properties){
        reducedObject[prop]= (items[i] as any)[prop] || undefined;
      }
      resultMap.set(items[i].id, reducedObject);
    }
    return resultMap;
  }
}
