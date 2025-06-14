import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoragehouseComponent } from './storagehouse.component';

describe('StoragehouseComponent', () => {
  let component: StoragehouseComponent;
  let fixture: ComponentFixture<StoragehouseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoragehouseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoragehouseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
