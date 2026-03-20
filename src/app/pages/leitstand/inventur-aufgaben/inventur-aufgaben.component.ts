import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { InventurService, InventurTask } from '../../inventur/inventur.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-inventur-aufgaben',
    standalone: true,
    imports: [CommonModule, MatIcon],
    templateUrl: './inventur-aufgaben.component.html',
    styleUrls: ['./inventur-aufgaben.component.scss']
})
export class InventurAufgabenComponent implements OnInit {
    inventurTasks: InventurTask[] = [];
    isLoadingInventur: boolean = false;

    constructor(
        private inventurService: InventurService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadInventurTasks();
    }

    loadInventurTasks(): void {
        const userid = this.authService.getUsername() || '';
        if (!userid) {
            return;
        }

        this.isLoadingInventur = true;
        this.inventurService.getAllTasks(userid).subscribe({
            next: (tasks) => {
                this.inventurTasks = tasks;
                this.isLoadingInventur = false;
            },
            error: () => {
                this.inventurTasks = [];
                this.isLoadingInventur = false;
            }
        });
    }
}
