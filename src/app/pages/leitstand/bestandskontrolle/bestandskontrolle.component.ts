import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bestandskontrolle',
    standalone: true,
    imports: [CommonModule, MatIcon],
    templateUrl: './bestandskontrolle.component.html',
    styleUrls: ['./bestandskontrolle.component.scss']
})
export class BestandskontrolleComponent implements OnInit {
    bestandskontrolleTasks: any[] = [];
    isLoading: boolean = false;

    ngOnInit(): void {
        this.loadTasks();
    }

    loadTasks(): void {
        // TODO: Implement when backend is ready
        this.bestandskontrolleTasks = [];
    }
}
