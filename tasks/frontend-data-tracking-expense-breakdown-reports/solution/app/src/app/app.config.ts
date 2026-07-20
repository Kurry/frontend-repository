import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { provideStore } from "@ngrx/store";
import { appReducer } from "./store/app.reducer";

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ app: appReducer }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync()
  ]
};
