import { Component } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.css'],
})
export class ScrollTopComponent {
  windowScrolled: boolean = false;

  ngOnInit() {
    window.addEventListener('scroll', () => {
      this.windowScrolled = window.pageYOffset >= window.innerHeight / 2;
    });
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }
}
