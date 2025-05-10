import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientEnrollementComponent } from './client-enrollement.component';

describe('ClientEnrollementComponent', () => {
  let component: ClientEnrollementComponent;
  let fixture: ComponentFixture<ClientEnrollementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientEnrollementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientEnrollementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
