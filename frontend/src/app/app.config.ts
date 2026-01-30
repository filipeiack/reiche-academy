import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Registrar locale pt-BR
registerLocaleData(localePt, 'pt-BR');

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { provideHighlightOptions } from 'ngx-highlightjs';
import { TranslateService } from './core/services/translate.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ForbiddenInterceptor } from './core/interceptors/forbidden.interceptor';
import { NgSelectConfig } from '@ng-select/ng-select';

const highlightOptions = {
  coreLibraryLoader: () => import('highlight.js/lib/core'),
  languages: {
    typescript: () => import('highlight.js/lib/languages/typescript'),
    scss: () => import('highlight.js/lib/languages/scss'),
    xml: () => import('highlight.js/lib/languages/xml')
  },
};

export function initializeApp(translateService: TranslateService) {
  return () => {
    // The translation service will automatically load the stored language or default to pt-BR
    return new Promise<void>((resolve) => {
      translateService.translations$.subscribe(() => {
        resolve();
      });
    });
  };
}

export function initializeNgSelect(config: NgSelectConfig) {
  return () => {
    config.notFoundText = 'Nenhum item encontrado';
    config.addTagText = 'Adicionar item';
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })), 
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    importProvidersFrom([SweetAlert2Module.forRoot()]), // ngx-sweetalert2: https://github.com/sweetalert2/ngx-sweetalert2
    provideHighlightOptions(highlightOptions), // ngx-highlightjs: https://github.com/murhafsousli/ngx-highlightjs
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ForbiddenInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslateService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeNgSelect,
      deps: [NgSelectConfig],
      multi: true
    }
  ],
};
