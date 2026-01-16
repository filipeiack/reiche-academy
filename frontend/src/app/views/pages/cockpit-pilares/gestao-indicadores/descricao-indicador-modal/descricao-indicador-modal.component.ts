import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-descricao-indicador-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descricao-indicador-modal.component.html',
  styleUrl: './descricao-indicador-modal.component.scss',
})
export class DescricaoIndicadorModalComponent {
  @Input() nomeIndicador!: string;
  @Input() descricao: string | null | undefined = '';

  public activeModal = inject(NgbActiveModal);

  descricaoAtual: string = '';
  maxLength = 500;

  ngOnInit(): void {
    this.descricaoAtual = this.descricao || '';
  }

  salvar(): void {
    this.activeModal.close(this.descricaoAtual.trim() || null);
  }

  cancelar(): void {
    this.activeModal.dismiss();
  }
}
