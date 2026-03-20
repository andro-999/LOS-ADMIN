import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { LeitstandService, EinlagerungTask } from '../leitstand.service';
import { UserService, User } from '../../../services/user.service';

@Component({
    selector: 'app-einlagerung-auftraege',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './einlagerung-auftraege.component.html',
    styleUrls: ['./einlagerung-auftraege.component.scss']
})
export class EinlagerungAuftraegeComponent implements OnInit {
    einlagerungTasks: EinlagerungTask[] = [];
    isLoadingEinlagerung: boolean = false;
    availableLageristen: User[] = [];

    constructor(
        private leitstandService: LeitstandService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.loadEinlagerungTasks();
        this.loadLageristen();
    }

    loadLageristen(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.availableLageristen = users;
            }
        });
    }

    isLageristInList(lagerist: string): boolean {
        return this.availableLageristen.some(u => u.benutzer_id === lagerist);
    }

    assignLagerist(task: EinlagerungTask, lageristId: string): void {
        task.lagerist = lageristId;
        // TODO: API call to persist the assignment
    }

    loadEinlagerungTasks(): void {
        this.isLoadingEinlagerung = true;
        this.leitstandService.getEinlagerungTasks().subscribe({
            next: (tasks) => {
                this.einlagerungTasks = tasks;
                this.isLoadingEinlagerung = false;
            },
            error: () => {
                this.einlagerungTasks = [];
                this.isLoadingEinlagerung = false;
            }
        });
    }
}
