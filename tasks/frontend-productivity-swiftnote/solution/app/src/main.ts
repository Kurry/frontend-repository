import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { AppComponent } from './app/app.component';
import { noteReducer, localStorageMetaReducer } from './app/store/note.reducer';

bootstrapApplication(AppComponent, {
  providers: [
    provideStore(
      { app: noteReducer },
      { metaReducers: [localStorageMetaReducer] }
    ),
  ]
}).catch(err => console.error(err));
