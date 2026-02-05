import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { VersionInfo } from '../models/version.model';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getVersion(): Observable<VersionInfo> {
    return this.http.get<VersionInfo>(`${this.apiUrl}/version`).pipe(
      timeout(5000), // 5 segundos timeout
      retry({
        count: 2, // Tentar 2 vezes
        delay: 500 // Aguardar 500ms entre tentativas
      })
    );
  }
}

