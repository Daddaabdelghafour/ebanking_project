import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoPageComponent } from './crypto-page.component';

describe('CryptoPageComponent', () => {
  let component: CryptoPageComponent;
  let fixture: ComponentFixture<CryptoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CryptoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
