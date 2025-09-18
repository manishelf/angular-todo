import { User } from "../../../models/User";
import { Axios } from "axios";
import { BehaviorSubject, debounceTime, take } from 'rxjs';
import { localUser } from "../../user/user.service";
import { TodoItem } from "../../../models/todo-item";
import {v4} from 'uuid'
export enum OP{
    SYNC,
    INIT,
    MERGE,
    REFRESH,
    FORCE
}

export interface todoItemState{
    uuid:string, updationTimestamp: string, version: number
}

export interface diffRequest{
    mergeItems: todoItemState[],
    deleteItems: todoItemState[]
}

let axios : Axios = new Axios();
let db: IDBDatabase | null = null;
let user: User | null = null;
let backendUrl: string | null = null;


axios.interceptors.request.use(async (config)=> {
    
    if(!user) return config;

    if(user.token != '' && isTokenExpired(user?.token)
        && !(config.url?.includes('/user/refresh') || config.url?.includes('/user/logout'))){
        let resp = await axios.get('/user/refresh');
        if(resp.status == 200){
            user!.token = resp.data.accessToken;
        }
    }
    
    if(config.url === '/item/save' || config.url === '/item/update'){       
          config.data.itemList.forEach((item: TodoItem)=>{
            if(item.userDefined){
              item.userDefined.formControlSchema.fields?.forEach((field)=>{
                    
                if(item.userDefined?.data){
                  if(field.type == 'image' || field.type == 'file' || field.type == 'iframe'){

                    let fieldKey = item.uuid+'_'+item.userDefined?.tag.name+'_'+field.name.replaceAll('/','_').replaceAll('\\','_');
                    
                    let data = (item.userDefined.data as any )[field.name] || '';
                    (item.userDefined.data as any)[field.name]=
                      '/item/doc/'+user?.userGroup+'_'+user?.email.replace('.','_').replace('@','_')+'_'+fieldKey;

                    const parts = data.split(';');
                    const mimeType = parts[0].split(':')[1];
                    let dataType = mimeType;
                    
                    postFileToBackend(
                      data,
                      fieldKey,
                      dataType,
                      fieldKey
                    ).then((refUrl)=>{

                    }).catch(()=>{
                      (item.userDefined?.data as any)[field.name]=data;
                    });
                  }
                } 
              });
            }
          });
        }

    config.headers.Authorization = 'Bearer '+ user.token;
    if(!(config.data instanceof FormData)){
        config.data = JSON.stringify(config.data);
    }
    if(!config.headers['Content-Type']){
        config.headers['Content-Type'] = 'application/json';
    }
    config.url = (backendUrl||'')+config.url;
    config.withCredentials = true;
    
    return config;
    }, function (error) {
    console.error(error);
    return Promise.reject(error);
    },
);

axios.interceptors.response.use((resp)=>{
    if(resp.data)
    resp.data = JSON.parse(resp.data);     
    return resp;
});


self.onmessage = (event)=>{
   let {op} = event.data;  
   switch(op){
    case OP.INIT:
        handleInit(event.data);
        break;
    case OP.MERGE:
        handleMerge(event.data);
        break;
   } 
}

function handleInit(data: any){
    user = data.user;
    backendUrl = data.backendUrl;

    initializeIndexDB().then((db)=>{
        getTodoItemFetchRequest().then((req)=>{
            
            if(!user || user?.email == localUser.email && user?.userGroup == localUser.userGroup) return;

            axios.post('/item/getdiff',req)
            .then(resp=>{
                if(resp.status == 200){
                   let itemsForAdd = resp.data.itemsForAdd;
                   let itemsForUpdate = resp.data.itemsForUpdate;
                   let itemsForDelete = resp.data.itemsForDelete;
                   let itemsForSync = resp.data.itemsForSync;

                   let done = new BehaviorSubject<boolean>(false);
                   let syncReq:TodoItem[] = [];
                   itemsForSync.forEach((itemReq: todoItemState) => {
                        getItemByUUID(itemReq.uuid).then((item)=>{
                            syncReq.push(item);
                            done.next(true);                        
                        });
                   });
                   
                   console.log(itemsForAdd, itemsForDelete, itemsForSync, itemsForUpdate);
                   
                   if(itemsForSync.length==0 && (itemsForAdd.length > 0 || itemsForUpdate.length > 0 || itemsForDelete.length > 0)){
                    done.next(true);
                   }

                   done.pipe(debounceTime(100)).subscribe((s)=>{
                     if(s){
                        
                        if(syncReq.length>0){
                            axios.patch('/item/update',{
                                itemList: syncReq
                            });
                        }

                        self.postMessage({
                            op: OP.MERGE,
                            itemsForAdd,
                            itemsForUpdate,
                            itemsForDelete
                        });
                     }
                   });
                }
            }).catch(e=>{
                console.error(e);
                throw e;
            });
        }); 
    });
}

function initializeIndexDB(): Promise<IDBDatabase>{ // the db cannot be shared accross threads!
    return new Promise((res, rej)=>{
        user = user?user:localUser;
        const request = indexedDB.open('todo_items_db/'+user.userGroup+'/'+user.email, 1);
        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            db.onerror = (err) => {
                throw (err as any).srcElement.error;
            };  
            res(db);          
        };
        request.onerror = rej;
    });
}

function handleMerge(event: any){

}

function getTodoItemFetchRequest():Promise<diffRequest>{
    return new Promise((res, rej)=>{
        let cursorRequ = getObjectStoreRO('todo_items')
                        .openCursor(null, 'prev');
        let mergeItems:todoItemState[] = [];
        let deleteItems: todoItemState[] = [];
        cursorRequ.onsuccess = (ev)=>{
            const cursor = (ev.target as IDBRequest).result;
            if(cursor){
                mergeItems.push({
                    uuid: cursor.value.uuid,
                    updationTimestamp: cursor.value.updationTimestamp,
                    version: cursor.value.version
                });
                cursor.continue();
            }else{
                cursorRequ = getObjectStoreRO('deleted_todo_items')
                                .openCursor(null,'prev');
                cursorRequ.onsuccess = (ev)=>{
                    const delCursor = (ev.target as IDBRequest).result;
                    if(cursor){
                        deleteItems.push({
                            uuid: cursor.value.uuid,
                            updationTimestamp: cursor.value.updationTimestamp,
                            version: cursor.value.version
                        });
                        delCursor.continue();
                    }else{
                        res({
                            mergeItems,
                            deleteItems
                        });
                    }
                }
            }
        }
        cursorRequ.onerror = e=>rej(e);
    });
}

// code repetation as this is completely seperate thread. wont need to do if implemented as es module

function isTokenExpired(token:string | undefined) {
  if(!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    let expirationTimeInSeconds = 0;
    if(payloadBase64){
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      expirationTimeInSeconds = payload.exp*1000;
    }
    return expirationTimeInSeconds<Date.now();
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
}

function getItemByUUID(uuid: string, fromBin: boolean = false): Promise<TodoItem>{
    return new Promise<TodoItem>((res, rej)=>{
        const storeName = fromBin ? 'deleted_todo_items' : 'todo_items';
        const store = getObjectStoreRO(storeName);
        const request = store.index('uuidIndex').get(uuid);
        request.onsuccess = (ev)=>{
            let result = (ev.target as IDBRequest).result;
            res(result);
        }
        request.onerror = rej;
    });
}

function  getObjectStoreRO(storeName: string):IDBObjectStore{    
    return db!.transaction(storeName, 'readonly').objectStore(storeName);
}

function  postFileToBackend(fileData: string, fileName: string, fileType: string, fileInfo: string):Promise<string>{
    return new Promise((res, rej)=>{
      let formData = new FormData();
      formData.append('file', dataURLtoBlob(fileData));
      formData.append('fileType', fileType);
      formData.append('fileInfo', fileInfo);
      formData.append('fileName', fileName);
      console.log(formData);
      
      axios.post('/item/save/document',
        formData,
        {
          headers:{
            "Content-Type":'multipart/form-data'
          }
        }
      ).then((resp)=>{
        res(resp.data.body);
      });
    });
}

function dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mime = (arr[0].match(/:(.*?);/) || [undefined, undefined])[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
  }
