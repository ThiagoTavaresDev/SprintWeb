import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { HemoterapiaComponent } from './app/hemoterapia.component';

bootstrapApplication(HemoterapiaComponent, { providers: [provideHttpClient()] })
  .catch(error => console.error(error));
