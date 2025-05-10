import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetingPageComponent } from './budgeting-page.component';

describe('BudgetingPageComponent', () => {
  let component: BudgetingPageComponent;
  let fixture: ComponentFixture<BudgetingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
