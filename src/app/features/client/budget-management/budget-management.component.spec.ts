import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetManagementComponent } from './budget-management.component';

describe('BudgetManagementComponent', () => {
  let component: BudgetManagementComponent;
  let fixture: ComponentFixture<BudgetManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
