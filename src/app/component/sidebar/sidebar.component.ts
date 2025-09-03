import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BeanItemComponent } from '../bean-item/bean-item.component';
import { RouterOutlet, RouterLink ,RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [BeanItemComponent, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

}
