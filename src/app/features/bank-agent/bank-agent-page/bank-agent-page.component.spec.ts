import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAgentPageComponent } from './bank-agent-page.component';

describe('BankAgentPageComponent', () => {
  let component: BankAgentPageComponent;
  let fixture: ComponentFixture<BankAgentPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankAgentPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAgentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
