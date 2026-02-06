import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter , withComponentInputBinding} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

import { ToastService } from 'angular-toastify';
import { provideServiceWorker } from '@angular/service-worker'; 
import { APP_BASE_HREF } from '@angular/common';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    ToastService, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
    { provide: APP_BASE_HREF, useValue: document.getElementsByTagName('base')[0].href } 
  ]

};
      