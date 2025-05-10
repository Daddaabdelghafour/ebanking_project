import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAgentProfileComponent } from './bank-agent-profile.component';

describe('BankAgentProfileComponent', () => {
  let component: BankAgentProfileComponent;
  let fixture: ComponentFixture<BankAgentProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankAgentProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAgentProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
