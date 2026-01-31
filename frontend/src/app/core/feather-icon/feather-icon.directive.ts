import { AfterViewInit, Directive } from '@angular/core';
import * as feather from 'feather-icons';

@Directive({
  selector: '[featherIcon],[appFeatherIcon]',
  standalone: true
})

export class FeatherIconDirective implements AfterViewInit{

  constructor() { }

  ngAfterViewInit(): void {
    feather.replace();
  }

}
