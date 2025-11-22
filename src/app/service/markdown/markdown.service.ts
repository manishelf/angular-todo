import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { collapsibleBlock, mediaEmbedExtension } from './customExtensions';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var Prism : any;

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {

  constructor(private domSanitizer: DomSanitizer) {
    marked.use({
      extensions: [collapsibleBlock, mediaEmbedExtension],
      gfm: true,
    });
   }

   parse(input:string):Promise<SafeHtml> {
    return new Promise((res, rej)=>{
      marked.parse(input, {async: true}).then((result)=>{
        let code =
          result.match(/<code class="language-(\w+)">([\s\S]*?)<\/code>/g) ||
          result.match(/<code>([\s\S]*?)<\/code>/);

        if (code) {
            for (let i = 0; i < code.length; i++) {
            let snippet = code[i];
            result = result.replace(snippet, snippet.replace(/<br>/g, '\n'));
          }
          requestAnimationFrame(() => {
            Prism.highlightAll();
          });
        }
        res(this.domSanitizer.bypassSecurityTrustHtml(result))
      });
    }); 
   }

}
