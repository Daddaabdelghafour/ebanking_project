import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankAgentSettingsComponent } from './bank-agent-settings.component';

describe('BankAgentSettingsComponent', () => {
  let component: BankAgentSettingsComponent;
  let fixture: ComponentFixture<BankAgentSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankAgentSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankAgentSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
