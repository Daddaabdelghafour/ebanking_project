import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripeManagementComponent } from './stripe-management.component';

describe('StripeManagementComponent', () => {
  let component: StripeManagementComponent;
  let fixture: ComponentFixture<StripeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StripeManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StripeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
