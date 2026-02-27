import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { LeitstandService, EinlagerungTask } from '../../leitstand/leitstand.service';

@Component({
    selector: 'app-kardex-einlagerung-modal',
    standalone: true,
    imports: [CommonModule, MatIcon],
    templateUrl: './kardex-einlagerung-modal.component.html',
    styleUrls: ['./kardex-einlagerung-modal.component.scss']
})
export class KardexEinlagerungModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();

    tasks: EinlagerungTask[] = [];
    isLoading = false;

    constructor(private leitstandService: LeitstandService) { }

    ngOnInit(): void {
        this.loadTasks();
    }

    loadTasks(): void {
        this.isLoading = true;
        this.leitstandService.getEinlagerungTasks().subscribe({
            next: (tasks) => {
                this.tasks = tasks;
                this.isLoading = false;
                console.log('Kardex-Einlagerung Aufgaben geladen:', tasks);
            },
            error: (err) => {
                console.error('Fehler beim Laden der Kardex-Einlagerung Aufgaben:', err);
                this.tasks = [];
                this.isLoading = false;
            }
        });
    }

    deleteTask(taskId: number): void {
        // TODO: Service-Methode für Task-Löschung wird später implementiert
        console.log('Task löschen:', taskId);
    }

    onClose(): void {
        this.close.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        // Schließe nur wenn auf den Hintergrund geklickt wurde
        if (event.target === event.currentTarget) {
            this.onClose();
        }
    }
}
