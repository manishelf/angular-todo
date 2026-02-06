import * as protobuf from 'protobufjs'
import { User } from '../../../models/User';
export enum SOC_OP {
  INIT,
  CONNECTED,
  DISCONNECTED,
  DISCONNECT,
  MESSAGE,
  SEND,
  REFRESH_MERGE = "REFRESH_MERGE"
}

let protobufRoot: any = null;
let TodoItemProto : any = null;
let MessageProto: any = null;
let UserProto: any = null;
let backendUrl: string = '';
let user: User | null = null;
let socket: ReconnectingWs | null = null;


self.onmessage = (message)=>{
  let data = message.data.target;  
  if(message.data.op == SOC_OP.INIT){
    handleInit(data.backendUrl, data.user);
  }
  if(message.data.op == SOC_OP.SEND){
    socket?.send(data);
    console.log(data);
  }
}



function handleInit(backendUrlx: string, userx: User){
  backendUrl = backendUrlx;
  user = userx;
  socket = new ReconnectingWs(backendUrl+'/ws'+'?sessionToken='+user.token);
  socket.handleMessage = (m)=>{
    self.postMessage({
      op: SOC_OP.MESSAGE,
      message: m
    })
  }
}

class ReconnectingWs{
  socket: WebSocket | null = null;
  maxAttempts = 10;
  backoff = 5000;
  currentAttemptCount = 0;
  reconnect = true;  
  reconnectTimer = -1;
  messageQueue: ArrayBuffer[] = [];
  url = '';
  handleClose = (e: CloseEvent)=>{}
  handleMessage = (message: any)=>{}
  handleOnOpen = (e: Event)=>{}
  handleError = (e: Event)=>{}

  constructor(url: string){
    this.url = url;
    this.connect();
  }

  connect(){
    this.socket = new WebSocket(this.url);
    this.socket.onerror = (e)=>{console.error(e); this.handleError(e)};
    this.socket.onopen = (e)=>{this.onopen(e)};
    this.socket.onmessage = (e)=>{this.onmessage(e)};
    this.socket.onclose = (e)=>{this.onclose(e)};
  }

  disconnect(){
    this.socket = null;
  }

  private async onmessage(e: MessageEvent){
    const data = e.data;
    const arrayBuffer = await data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let message = await decodeProtoBuff(uint8Array);
    console.log("Sock got",message);
    
    this.handleMessage(message);    
  }

  private onopen(e: Event){
    this.reconnect = false;
    clearTimeout(this.reconnectTimer);
    this.currentAttemptCount = 0;
    this.reconnectTimer = -1;
    this.handleOnOpen(e);    
    console.log("open ",1);
  }

  private onclose(e: CloseEvent){
    console.log("Disconnected ", e.wasClean, e.reason);
    
    if(!e.wasClean){
      this.reconnect = true;
      clearTimeout(this.reconnectTimer);
      if(this.currentAttemptCount<this.maxAttempts){
        setTimeout(()=>{
          this.connect();
          this.currentAttemptCount++;
        }, Math.pow(2, this.currentAttemptCount)*this.backoff);
      }
    }    
    this.handleClose(e);
  }

  send(d: any){
    const message = MessageProto.create(d);
    const buffer = MessageProto.encode(message).finish();
    if(this.socket?.readyState == WebSocket.OPEN){
      this.socket?.send(buffer);
      console.log("Socket send ", d);
            
      if(this.messageQueue.length!=0){
        this.messageQueue.forEach((d)=>{
          this.send(d);
        });
        this.messageQueue = [];
      }
    }else{
      this.messageQueue.push(buffer);
    }
  }
}

function decodeProtoBuff(buffer: Uint8Array): Promise<any>{
  return new Promise(async (res, rej)=>{
    if(!protobufRoot){
      const currentOrigin = self.location.href.split('/').slice(0, 3).join('/');
      // bug / function of protobufjs where if the url is same as current origin 
      // then the http root is removed and the url is treated as relative
      // ie malformed url is created
      let path = '';
      if (backendUrl === currentOrigin) {
        path = '/proto/sock_message.proto';
      } else {
        path = backendUrl + '/proto/sock_message.proto';
      }

      protobufRoot = await protobuf.load(path);      
      MessageProto = protobufRoot.lookupType('MessageProto');
    }
    let err = true && MessageProto.verify(buffer);
    
    if(err){
      rej(err); 
      return;
    }
    const decodedMessage = MessageProto.decode(buffer);
    res(decodedMessage);
  });
}