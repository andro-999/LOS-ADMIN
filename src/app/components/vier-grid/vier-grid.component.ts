import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-vier-grid',
  standalone: true,
  imports: [MatIcon, CommonModule],
  templateUrl: './vier-grid.component.html',
  styleUrl: './vier-grid.component.scss'
})
export class VierGridComponent {
  pagedUsers: any[] = [];
  us: any[] = [{ id: 1, name: 'alice', rolle: 'admin' }, { id: 2, name: 'bob', rolle: 'lagerist' }, { id: 3, name: 'charlie', rolle: 'fahrer' }];
  verwaltungOpen: boolean = false;

  editUser(user: any) {

  }

  deleteUser(user: any) { }

  toggleVerwaltung() {
    this.verwaltungOpen = !this.verwaltungOpen;
  }
}
