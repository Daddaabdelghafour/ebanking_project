import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantIaPageComponent } from './assistant-ia-page.component';

describe('AssistantIaPageComponent', () => {
  let component: AssistantIaPageComponent;
  let fixture: ComponentFixture<AssistantIaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantIaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantIaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
