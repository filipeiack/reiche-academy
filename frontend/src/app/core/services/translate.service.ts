import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'pt-BR' | 'en-US';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private currentLang = new BehaviorSubject<Language>('pt-BR');
  private translations = new BehaviorSubject<any>({});
  
  public currentLang$ = this.currentLang.asObservable();
  public translations$ = this.translations.asObservable();

  public readonly languages: LanguageOption[] = [
    { code: 'pt-BR', name: 'Português', flag: 'assets/images/flags/br.svg' },
    { code: 'en-US', name: 'English', flag: 'assets/images/flags/us.svg' }
  ];

  private readonly STORAGE_KEY = 'app_language';

  constructor(private http: HttpClient) {
    this.loadStoredLanguage();
  }

  private loadStoredLanguage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Language;
    const lang = stored && this.isValidLanguage(stored) ? stored : 'pt-BR';
    this.use(lang);
  }

  private isValidLanguage(lang: string): lang is Language {
    return lang === 'pt-BR' || lang === 'en-US';
  }

  use(lang: Language): void {
    this.http.get(`assets/i18n/${lang}.json`).subscribe({
      next: (translations) => {
        this.translations.next(translations);
        this.currentLang.next(lang);
        localStorage.setItem(this.STORAGE_KEY, lang);
        document.documentElement.lang = lang;
      },
      error: (err) => {
        console.error(`Error loading translations for ${lang}:`, err);
      }
    });
  }

  getCurrentLanguage(): Language {
    return this.currentLang.value;
  }

  getTranslations(): any {
    return this.translations.value;
  }

  instant(key: string): string {
    const keys = key.split('.');
    let result: any = this.translations.value;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  }

  get(key: string): Observable<string> {
    return new Observable(observer => {
      const subscription = this.translations$.subscribe(() => {
        observer.next(this.instant(key));
      });
      return () => subscription.unsubscribe();
    });
  }

  switchLanguage(): void {
    const current = this.getCurrentLanguage();
    const next: Language = current === 'pt-BR' ? 'en-US' : 'pt-BR';
    this.use(next);
  }
}
