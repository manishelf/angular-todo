import { Component,Input } from '@angular/core';
import { RouterLink ,RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bean-item',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bean-item.component.html',
  styleUrl: './bean-item.component.css'
})
export class BeanItemComponent {

  @Input('routerLink') routerLink:string = '';

}
