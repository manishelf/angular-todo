import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive } from '@angular/router';
import * as marked from 'marked';

@Component({
  selector: 'app-about',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit{
/**
 * add menu for proper details
 * add info for shortcuts
 */
  parsedMD: SafeHtml = '';

  constructor(private domSanitizer: DomSanitizer){}

  ngOnInit(): void {
    fetch('/about.md').then((resp)=>{
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
