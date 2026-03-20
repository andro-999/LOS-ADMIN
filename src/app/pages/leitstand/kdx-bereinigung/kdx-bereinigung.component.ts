import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { LeitstandService, KdxRegalplatz } from '../leitstand.service';

@Component({
    selector: 'app-kdx-bereinigung',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './kdx-bereinigung.component.html',
    styleUrls: ['./kdx-bereinigung.component.scss']
})
export class KdxBereinigungComponent implements OnInit {
    @Input() searchTerm: string = '';
    @Input() kdxReserviertFilter: string = '';
    @Output() filterChanged = new EventEmitter<void>();

    kdxTurmNr: number = 3;
    kdxTablarNr: number = 1;
    kdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
    filteredKdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
    isLoadingKdxBoxen: boolean = false;

    constructor(private leitstandService: LeitstandService) { }

    ngOnInit(): void {
        this.loadKdxBoxen();
    }

    loadKdxBoxen(): void {
        if (!this.kdxTurmNr || !this.kdxTablarNr) {
            return;
        }

        this.isLoadingKdxBoxen = true;
        this.kdxRegalplaetze = [];

        this.leitstandService.getKdxBoxen(this.kdxTurmNr, this.kdxTablarNr).subscribe({
            next: (response) => {
                if (response.success && response.boxen) {
                    const plaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
                    response.boxen.forEach((box) => {
                        box.rows.forEach((row) => {
                            row.forEach((cell) => {
                                plaetze.push({ ...cell, releasing: false });
                            });
                        });
                    });
                    this.kdxRegalplaetze = plaetze;
                    this.filterKdxRegalplaetze();
                }
                this.isLoadingKdxBoxen = false;
            },
            error: () => {
                this.isLoadingKdxBoxen = false;
            }
        });
    }

    filterKdxRegalplaetze(): void {
        const searchLower = this.searchTerm.toLowerCase().trim();

        this.filteredKdxRegalplaetze = this.kdxRegalplaetze.filter(platz => {
            const textMatch = !searchLower || platz.regalNr.toLowerCase().includes(searchLower);

            let reserviertMatch = true;
            if (this.kdxReserviertFilter === 'reserviert') {
                reserviertMatch = platz.gesperrt === true;
            } else if (this.kdxReserviertFilter === 'frei') {
                reserviertMatch = platz.gesperrt === false;
            }

            return textMatch && reserviertMatch;
        });
    }

    releaseRegalplatz(regalNr: string): void {
        const platz = this.kdxRegalplaetze.find(p => p.regalNr === regalNr);
        if (platz) {
            platz.releasing = true;
        }

        this.leitstandService.releaseKdxRegal(regalNr).subscribe({
            next: (response) => {
                if (response.success && platz) {
                    platz.gesperrt = false;
                    platz.releasing = false;
                    this.filterKdxRegalplaetze();
                }
            },
            error: () => {
                if (platz) {
                    platz.releasing = false;
                }
            }
        });
    }

    getReserviertCount(): number {
        return this.kdxRegalplaetze.filter(p => p.gesperrt).length;
    }
}
