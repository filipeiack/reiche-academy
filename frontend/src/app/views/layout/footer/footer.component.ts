import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService } from '../../../core/services/version.service';
import { VersionInfo } from '../../../core/models/version.model';
import { environment } from '../../../../environments/environment';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  private versionService = inject(VersionService);
  
  versionInfo: VersionInfo | null = null;
  version = 'dev';
  environmentName = environment.environmentName;

  ngOnInit(): void {
    this.loadVersion();
  }

  private loadVersion(): void {
    this.versionService.getVersion()
      .pipe(
        catchError((err) => {
          console.warn('Erro ao carregar versão do servidor:', err);
          // Retorna valor padrão em caso de erro
          return of(null);
        })
      )
      .subscribe({
        next: (info) => {
          if (info) {
            this.versionInfo = info;
            this.version = info.version;
            this.environmentName = environment.environmentName.toLowerCase();
          } else {
            // Fallback se API retornar null
            this.version = 'dev';
            this.environmentName = environment.environmentName;
          }
        }
      });
  }
}
