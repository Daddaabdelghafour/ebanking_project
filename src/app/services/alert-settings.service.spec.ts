import { TestBed } from '@angular/core/testing';

import { AlertSettingsService } from './alert-settings.service';

describe('AlertSettingsService', () => {
  let service: AlertSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
