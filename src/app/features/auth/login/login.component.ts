import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-login',
  template: `
    <div class="max-w-md mx-auto mt-24 p-6 border rounded">
      <h2 class="text-2xl mb-4">Sign in</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="mb-3">
          <label class="block mb-1">Email</label>
          <input formControlName="email" type="email" class="w-full p-2 border rounded" />
        </div>
        <div class="mb-3">
          <label class="block mb-1">Password</label>
          <input formControlName="password" type="password" class="w-full p-2 border rounded" />
        </div>
        <div class="flex items-center justify-between">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded" [disabled]="form.invalid">Sign in</button>
        </div>
      </form>
    </div>
  `
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.auth.signIn(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => alert('Login failed: ' + (err?.message || err))
    });
  }
}
