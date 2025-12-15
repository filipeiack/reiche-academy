import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | '';
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.sortable]': 'true'
  }
})
export class SortableDirective {
  @Input() sortable: string = '';
  @Input() direction: 'asc' | 'desc' | '' = '';
  @Output() sort = new EventEmitter<SortEvent>();

  @HostBinding('class.asc') get asc() { return this.direction === 'asc'; }
  @HostBinding('class.desc') get desc() { return this.direction === 'desc'; }

  @HostListener('click') onClick() {
    this.rotate();
  }

  rotate() {
    if (this.direction === '') {
      this.direction = 'asc';
    } else if (this.direction === 'asc') {
      this.direction = 'desc';
    } else {
      this.direction = '';
    }

    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
