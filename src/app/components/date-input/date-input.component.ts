import { Component, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-date-input',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIcon],
    templateUrl: './date-input.component.html',
    styleUrls: ['./date-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputComponent),
            multi: true
        }
    ]
})
export class DateInputComponent implements ControlValueAccessor {
    @ViewChild('hiddenPicker') hiddenPicker!: ElementRef<HTMLInputElement>;

    displayValue: string = '';
    internalValue: string = '';

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: string): void {
        if (value) {
            this.internalValue = value;
            this.displayValue = this.formatDisplay(value);
        } else {
            this.internalValue = '';
            this.displayValue = '';
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    onTextInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const raw = input.value;
        // Allow only digits and dots
        const cleaned = raw.replace(/[^0-9.]/g, '');
        input.value = cleaned;
        this.displayValue = cleaned;

        // Auto-trigger when exactly 8 digits are entered (DDMMYYYY)
        const digits = cleaned.replace(/\D/g, '');
        if (digits.length === 8) {
            this.triggerParse(input);
        }
    }

    onEnter(event: Event): void {
        this.triggerParse(event.target as HTMLInputElement);
    }

    onBlur(): void {
        this.onTouched();
        this.triggerParse(null);
    }

    private triggerParse(inputEl: HTMLInputElement | null): void {
        const parsed = this.parseInput(this.displayValue);
        if (parsed) {
            this.internalValue = parsed;
            this.displayValue = this.formatDisplay(parsed);
            if (inputEl) inputEl.value = this.displayValue;
            this.onChange(parsed);
        } else if (this.displayValue.trim() === '') {
            this.internalValue = '';
            this.displayValue = '';
            if (inputEl) inputEl.value = '';
            this.onChange('');
        }
        // Invalid input: keep displayValue as-is, don't emit
    }

    onCalendarChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value; // YYYY-MM-DD
        if (value) {
            this.internalValue = value;
            this.displayValue = this.formatDisplay(value);
            this.onChange(value);
        }
    }

    openCalendar(): void {
        const el = this.hiddenPicker.nativeElement;
        if (typeof (el as any).showPicker === 'function') {
            try {
                (el as any).showPicker();
            } catch {
                el.click();
            }
        } else {
            el.click();
        }
    }

    /**
     * Parses flexible date input into YYYY-MM-DD.
     * Supported formats:
     *   01012027  (DDMMYYYY)
     *   010127    (DDMMYY)
     *   01.01.2027
     *   01.01.27
     */
    private parseInput(raw: string): string | null {
        if (!raw || raw.trim() === '') return null;

        const digits = raw.replace(/\D/g, '');

        let day: number, month: number, year: number;

        if (digits.length === 8) {
            // DDMMYYYY
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            year = parseInt(digits.substring(4, 8), 10);
        } else if (digits.length === 6) {
            // DDMMYY
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            const yy = parseInt(digits.substring(4, 6), 10);
            year = yy < 50 ? 2000 + yy : 1900 + yy;
        } else if (digits.length === 4) {
            // DDMM — use current year
            day = parseInt(digits.substring(0, 2), 10);
            month = parseInt(digits.substring(2, 4), 10);
            year = new Date().getFullYear();
        } else {
            return null;
        }

        if (month < 1 || month > 12 || day < 1 || day > 31) return null;

        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null; // Invalid date (e.g. 30.02.2027)
        }

        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    /** Converts YYYY-MM-DD to DD.MM.YYYY */
    private formatDisplay(isoDate: string): string {
        if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
        const [y, m, d] = isoDate.split('-');
        return `${d}.${m}.${y}`;
    }
}
