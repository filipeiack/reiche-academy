import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <h1>{{ title }}</h1>
      <p>Bem-vindo ao Reiche Academy!</p>
      <router-outlet />
    </div>
  `,
  styles: [`
    .app-container {
      padding: 2rem;
      text-align: center;
    }
    
    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'Reiche Academy';
}
