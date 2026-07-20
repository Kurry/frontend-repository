import { Component } from '@angular/core';
import { WebmcpService } from "./services/webmcp.service";
import { LayoutComponent } from './components/layout/layout.component';
import { ModalsComponent } from './components/modals/modals.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private webmcp: WebmcpService) { this.webmcp.registerTools(); }
}
