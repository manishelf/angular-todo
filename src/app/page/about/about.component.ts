import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as marked from 'marked';
import { UserService } from './../../service/user/user.service';
import { ConnectionService } from './../../service/connection/connection.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit{
/**
 * add menu for proper details
 * add info for shortcuts
 */
  parsedMD: SafeHtml = '';
  swaggerConsoleUrl = '';
  h2ConsoleUrl = '';

  constructor(private domSanitizer: DomSanitizer, private userService: UserService, private connectionService: ConnectionService){
    userService.loggedInUser$.subscribe((user)=>{
      this.swaggerConsoleUrl = connectionService.backendUrl+'/swagger-ui/index.html?sessionToken='+user?.token;
      this.h2ConsoleUrl = connectionService.backendUrl+'/qtodo-h2-console?sessionToken='+user?.token;
    });
  }

  ngOnInit(): void {
    fetch('./about.md').then((resp)=>{
      let body = resp.body;
      let reader = body?.getReader();
      let decoder = new TextDecoder();
      reader?.read().then((readerResult)=>{
        let md = decoder.decode(readerResult.value, {stream: !readerResult.done});
        let markdown = marked.parse(md).toString();
        this.parsedMD = this.domSanitizer.bypassSecurityTrustHtml(markdown);
      })
    });
  }
}
