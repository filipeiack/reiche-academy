import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>Dashboard</h2>
      <p>Bem-vindo ao sistema Reiche Academy!</p>
      <div class="cards-grid">
        <div class="card">
          <h3>Diagnósticos</h3>
          <p>Gerencie seus diagnósticos empresariais</p>
        </div>
        <div class="card">
          <h3>Pilares</h3>
          <p>Configure os pilares do sistema</p>
        </div>
        <div class="card">
          <h3>Empresas</h3>
          <p>Cadastro de empresas</p>
        </div>
        <div class="card">
          <h3>Usuários</h3>
          <p>Gestão de usuários</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
    }

    h2 {
      color: #1976d2;
      margin-bottom: 2rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .card h3 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .card p {
      color: #666;
      font-size: 0.9rem;
    }
  `]
})
export class DashboardComponent {}
