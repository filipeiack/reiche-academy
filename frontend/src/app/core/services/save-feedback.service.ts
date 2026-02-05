import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SaveFeedback {
  context: string; // Ex: "Valores mensais", "Contexto do pilar", "Status de processos"
  saving: boolean;
  lastSaveTime: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class SaveFeedbackService {
  private feedbackSubject = new BehaviorSubject<SaveFeedback>({
    context: '',
    saving: false,
    lastSaveTime: null,
  });

  public feedback$: Observable<SaveFeedback> = this.feedbackSubject.asObservable();

  /**
   * Inicia feedback de salvamento para um contexto específico
   */
  startSaving(context: string): void {
    this.feedbackSubject.next({
      context,
      saving: true,
      lastSaveTime: this.feedbackSubject.value.lastSaveTime,
    });
  }

  /**
   * Finaliza feedback de salvamento com sucesso
   */
  completeSaving(): void {
    const current = this.feedbackSubject.value;
    this.feedbackSubject.next({
      context: current.context,
      saving: false,
      lastSaveTime: new Date(), // Não usar normalizeDateToSaoPaulo - zera horário!
    });
  }

  /**
   * Reseta o feedback (limpa mensagens)
   */
  reset(): void {
    this.feedbackSubject.next({
      context: '',
      saving: false,
      lastSaveTime: null,
    });
  }
}
