import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnSelectModalComponent } from './column-select-modal.component';

describe('ColumnSelectModalComponent', () => {
  let component: ColumnSelectModalComponent;
  let fixture: ComponentFixture<ColumnSelectModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ColumnSelectModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnSelectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
