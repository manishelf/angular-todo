import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUserPermissionsComponent } from './manage-user-permissions.component';

describe('MangeUserPermissionsComponent', () => {
  let component: ManageUserPermissionsComponent;
  let fixture: ComponentFixture<ManageUserPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageUserPermissionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUserPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
