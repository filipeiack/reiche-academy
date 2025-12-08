import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EmpresaCustomization } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class CustomizationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/empresas`;

  // Assets e cores padrão da Reiche Academy (Design System)
  private readonly DEFAULT_LOGO = '/assets/images/logo_reiche_academy.png';
  private readonly DEFAULT_BACKGROUND = '/assets/images/login-bg.jpg';
  
  // Cores da paleta oficial (design_system_byGPT.md)
  private readonly DEFAULT_PRIMARY_COLOR = '#B6915D';      // Dourado 01
  private readonly DEFAULT_SECONDARY_COLOR = '#D1B689';    // Dourado 02
  private readonly DEFAULT_DARK_COLOR = '#242B2E';         // Azul Grafite
  private readonly DEFAULT_LIGHT_COLOR = '#EFEFEF';        // Branco

  /**
   * Busca customização por CNPJ da empresa
   * Se não encontrar ou houver erro, retorna customização padrão
   */
  getCustomizationByCnpj(cnpj: string): Observable<EmpresaCustomization> {
    return this.http.get<any>(`${this.API_URL}/customization/${cnpj}`).pipe(
      map(empresa => ({
        logoUrl: empresa.logoUrl || this.DEFAULT_LOGO,
        backgroundUrl: empresa.backgroundUrl || this.DEFAULT_BACKGROUND,
        corPrimaria: empresa.corPrimaria || this.DEFAULT_PRIMARY_COLOR,
        corSecundaria: empresa.corSecundaria || this.DEFAULT_SECONDARY_COLOR
      })),
      catchError(() => of(this.getDefaultCustomization()))
    );
  }

  /**
   * Busca customização por ID da empresa
   */
  getCustomizationById(empresaId: string): Observable<EmpresaCustomization> {
    return this.http.get<any>(`${this.API_URL}/${empresaId}`).pipe(
      map(empresa => ({
        logoUrl: empresa.logoUrl || this.DEFAULT_LOGO,
        backgroundUrl: empresa.backgroundUrl || this.DEFAULT_BACKGROUND,
        corPrimaria: empresa.corPrimaria || this.DEFAULT_PRIMARY_COLOR,
        corSecundaria: empresa.corSecundaria || this.DEFAULT_SECONDARY_COLOR
      })),
      catchError(() => of(this.getDefaultCustomization()))
    );
  }

  /**
   * Retorna customização padrão da Reiche Academy
   */
  getDefaultCustomization(): EmpresaCustomization {
    return {
      logoUrl: this.DEFAULT_LOGO,
      backgroundUrl: this.DEFAULT_BACKGROUND,
      corPrimaria: this.DEFAULT_PRIMARY_COLOR,
      corSecundaria: this.DEFAULT_SECONDARY_COLOR
    };
  }

  /**
   * Aplica cores do tema dinamicamente (CSS Variables)
   * Cores: Dourado 01 (primária), Dourado 02 (secundária), Azul Grafite (escuro), Branco (claro)
   */
  applyThemeColors(primaryColor?: string, secondaryColor?: string): void {
    const root = document.documentElement;
    
    if (primaryColor) {
      root.style.setProperty('--color-gold-1', primaryColor);
    }
    
    if (secondaryColor) {
      root.style.setProperty('--color-gold-2', secondaryColor);
    }
  }

  /**
   * Retorna as cores padrão do sistema para referência
   */
  getDefaultColors() {
    return {
      primary: this.DEFAULT_PRIMARY_COLOR,      // #B6915D
      secondary: this.DEFAULT_SECONDARY_COLOR,  // #D1B689
      dark: this.DEFAULT_DARK_COLOR,            // #242B2E
      light: this.DEFAULT_LIGHT_COLOR           // #EFEFEF
    };
  }
}
