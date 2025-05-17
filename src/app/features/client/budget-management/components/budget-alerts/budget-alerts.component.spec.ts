import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetAlertsComponent } from './budget-alerts.component';

describe('BudgetAlertsComponent', () => {
  let component: BudgetAlertsComponent;
  let fixture: ComponentFixture<BudgetAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
