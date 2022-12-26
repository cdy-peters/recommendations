import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  windowScrolled: boolean = false;
  title = 'recommendations';

  ngOnInit() {
    window.addEventListener('scroll', () => {
      this.windowScrolled = window.pageYOffset >= window.innerHeight / 2;
    });
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }
}
