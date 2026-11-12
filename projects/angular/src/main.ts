import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { PedidosComponent } from './app/pedidos.component';

bootstrapApplication(PedidosComponent, { providers: [provideHttpClient()] })
  .catch(error => console.error(error));
