import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeModeService {

  readonly currentTheme = new BehaviorSubject<string>('light');
  
  constructor() {

    // Change the theme based on whether there is a 'theme' parameter in the query string.
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (this.isValidTheme(themeParam)) {
      this.applyTheme(themeParam);
      return;
    }

    const preferredTheme = this.getPreferredTheme();
    this.applyTheme(preferredTheme);
  }

  getStoredTheme = () => localStorage.getItem('theme');
  setStoredTheme = (theme: string) => localStorage.setItem('theme', theme);

  getPreferredTheme = () => {
    const storedTheme = this.getStoredTheme();
    if (this.isValidTheme(storedTheme)) {
      return storedTheme;
    }

    return 'light'; // Tema padrão
  }

  setTheme = (theme: string) => {
    this.currentTheme.next(theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private applyTheme(theme: string): void {
    this.setStoredTheme(theme);
    this.setTheme(theme);
  }

  private isValidTheme(theme: string | null): theme is 'light' | 'dark' {
    return theme === 'light' || theme === 'dark';
  }

  toggleTheme(theme: string) {
    this.currentTheme.next(theme);
    this.setStoredTheme(this.currentTheme.value);
    this.setTheme(this.currentTheme.value);
  }

}
