import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Storagehouse2Component } from './storagehouse2.component';

describe('Storagehouse2Component', () => {
  let component: Storagehouse2Component;
  let fixture: ComponentFixture<Storagehouse2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Storagehouse2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Storagehouse2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
