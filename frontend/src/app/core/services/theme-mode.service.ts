import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeModeService {

  readonly currentTheme = new BehaviorSubject<string>('dark');
  
  constructor() {

    // Change the theme based on whether there is a 'theme' parameter in the query string.
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if ( (themeParam === 'light') || (themeParam === 'dark')) {
      this.toggleTheme(themeParam);
    }

    // Set initial localStorage 'theme' value to 'dark' if 'null'
    if (this.getStoredTheme() === null) {
      this.setStoredTheme('dark');
    }
    
    // Set the initial theme.
    this.setTheme(this.getPreferredTheme());
  }

  getStoredTheme = () => localStorage.getItem('theme');
  setStoredTheme = (theme: string) => localStorage.setItem('theme', theme);

  getPreferredTheme = () => {
    const storedTheme = this.getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    return 'dark'; // Tema padrão
  }

  setTheme = (theme: string) => {
    this.currentTheme.next(theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  toggleTheme(theme: string) {
    this.currentTheme.next(theme);
    this.setStoredTheme(this.currentTheme.value);
    this.setTheme(this.currentTheme.value);
  }

}
