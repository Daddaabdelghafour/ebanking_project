import { TestBed } from '@angular/core/testing';

import { CryptoTradingService } from './crypto-trading.service';

describe('CryptoTradingService', () => {
  let service: CryptoTradingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoTradingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
