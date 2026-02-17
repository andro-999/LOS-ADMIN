import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBtnComponent } from '../nav-btn/nav-btn.component';
import { Router } from '@angular/router';

export interface NavButton {
  label: string;
  count: number;
  isActive: boolean;
  showCount?: boolean;
  route?: string;
  clickHandler?: () => void;
}

@Component({
  selector: 'app-nav-block',
  standalone: true,
  imports: [CommonModule, NavBtnComponent],
  templateUrl: './nav-block.component.html',
  styleUrls: ['./nav-block.component.scss']
})
export class NavBlockComponent implements OnInit {
  @Input() buttons: NavButton[] = [];
  @Input() showSearch: boolean = false;
  @Input() searchTerm: string = '';
  @Input() selectedPriority: string = '';
  @Input() selectedStatus: string = '';
  @Input() availablePriorities: number[] = [];

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectedPriorityChange = new EventEmitter<string>();
  @Output() selectedStatusChange = new EventEmitter<string>();
  @Output() filterChanged = new EventEmitter<void>();
  @Output() refreshClicked = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  constructor(private router: Router) { }

  ngOnInit(): void { }

  onButtonClick(button: NavButton): void {
    if (button.clickHandler) {
      button.clickHandler();
    } else if (button.route) {
      this.router.navigate([button.route]);
    }
  }

  onSearchChange(value: string): void {
    this.searchTermChange.emit(value);
    this.filterChanged.emit();
  }

  onPriorityChange(value: string): void {
    this.selectedPriorityChange.emit(value);
    this.filterChanged.emit();
  }

  onStatusChange(value: string): void {
    this.selectedStatusChange.emit(value);
    this.filterChanged.emit();
  }

  onRefresh(): void {
    this.refreshClicked.emit();
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedPriority || this.selectedStatus);
  }
}