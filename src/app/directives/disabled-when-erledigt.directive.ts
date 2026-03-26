import { Directive, ElementRef, Input, Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { LeitstandService, Auftrag } from '../pages/leitstand/leitstand.service';

/**
 * Directive to disable interactive elements when an Auftrag is completed (erledigt).
 * 
 * Usage:
 *   <button [appDisabledWhenErledigt]="auftrag" (click)="deleteAuftrag(...)">
 *   <select [appDisabledWhenErledigt]="auftrag">
 * 
 * When the Auftrag is erledigt:
 * - Sets disabled attribute to true
 * - Adds 'disabled-erledigt' CSS class for styling
 * - Reduces opacity and removes pointer events
 */
@Directive({
    selector: '[appDisabledWhenErledigt]',
    standalone: true
})
export class DisabledWhenErledigtDirective implements OnChanges {
    @Input('appDisabledWhenErledigt') auftrag: Auftrag | null = null;

    constructor(
        private el: ElementRef<HTMLButtonElement | HTMLSelectElement>,
        private renderer: Renderer2,
        private leitstandService: LeitstandService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['auftrag']) {
            this.updateDisabledState();
        }
    }

    private updateDisabledState(): void {
        if (!this.auftrag) {
            this.setDisabled(false);
            return;
        }

        const isErledigt = this.leitstandService.isAuftragErledigt(this.auftrag);
        this.setDisabled(isErledigt);
    }

    private setDisabled(disabled: boolean): void {
        const element = this.el.nativeElement;

        if (disabled) {
            this.renderer.setAttribute(element, 'disabled', 'true');
            this.renderer.addClass(element, 'disabled-erledigt');
        } else {
            this.renderer.removeAttribute(element, 'disabled');
            this.renderer.removeClass(element, 'disabled-erledigt');
        }
    }
}
