import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeanItemComponent } from './bean-item.component';

describe('BeanItemComponent', () => {
  let component: BeanItemComponent;
  let fixture: ComponentFixture<BeanItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeanItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeanItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
