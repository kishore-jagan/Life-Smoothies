import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainhouseComponent } from './mainhouse.component';

describe('MainhouseComponent', () => {
  let component: MainhouseComponent;
  let fixture: ComponentFixture<MainhouseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainhouseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainhouseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
