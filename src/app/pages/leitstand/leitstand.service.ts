import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface DeletePartResponse {
  msg?: string;
  success: boolean;
  error?: string;
}
interface DeleteTaskResponse {
  msg?: string;
  success: boolean;
  error?: string;
}
interface Position {
  belegnummer: string;
  belegart: number;
  zeilennummer: number;
  artikelnummer: string;
  lieferdatum: string;
  beschreibung: string;
  zusatz_beschreibung: string;
  einheit: string;
  zu_liefern: number;
  regalnummer: string;
  lagerbestand: number;
  filialcode: string;
  prioritaet: number;
  lagerist: string;
  lagerist_rueck: string;
  verkauf_an_name: string;
  liefer_an_name: string;
  liefer_an_adresse: string;
  liefer_an_ort: string;
  liefer_an_plz_code: string;
  menge_rueck: number;
  // ... weitere Felder nach Bedarf
}
interface AuftragData {
  AU_number: string;
  delivery_date: string;
  exist_open_task: boolean;
  priority: number;
  all_positions: Position[];
}

interface AuftraegeApiResponse {
  data: {
    [belegnummer: string]: AuftragData;
  };
  success: boolean;
}
export interface Auftrag {
  id: number;
  auftragsnummer: string;
  kunde: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  lagerist?: string;
  positionen?: Position[];
  lieferdatum?: Date;
  erledigt?: boolean;
  prioritaet?: number;
  lageristRueck?: string;
  belegnummer?: string;
}

// Einlagerung Task Interfaces
export interface EinlagerungTask {
  id: number;
  entry_number: number;
  abholort: string;
  basis_menge: number;
  artikelnummer: string;
}

interface EinlagerungTaskRaw {
  entry_number: number;
  abholort: string;
  basis_menge: number;
  artikelnummer: string;
}

interface EinlagerungTasksResponse {
  success: boolean;
  tasks: { [key: string]: EinlagerungTaskRaw }[];
  task_count: number;
}

// KDX Boxen Interfaces
export interface KdxRegalplatz {
  rowNr: number;
  columnNr: number;
  width: number;
  length: number;
  besetzt: boolean;
  gesperrt: boolean;
  gewicht: number;
  artikelnummer: string;
  regalNr: string;
  size: string;
  releasing?: boolean;
}

export interface KdxBox {
  rows: KdxRegalplatz[][];
  lable: string;
  boxNumber: string;
  width: number;
  length: number;
  max_stroge_place: number;
  gewicht: number;
}

export interface KdxBoxenResponse {
  success: boolean;
  boxen: KdxBox[];
  box_count: number;
}

export interface KdxReleaseResponse {
  success: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class LeitstandService {
  private baseUrl = 'http://bsc-s-webserver.bsc-intern.de:8080/leitstand';
  private sinBotUrl = 'http://bsc-s-webserver.bsc-intern.de:8080/single_bottle_kommi';
  private einlagerungUrl = 'http://bsc-s-webserver.bsc-intern.de:8080/einlagerung_kdx';

  constructor(private http: HttpClient) { }

  deletePartOfKommiTask(belegnummer: string, zeilennummer: string): Observable<DeletePartResponse> {
    return this.http.get<DeletePartResponse>(
      `${this.baseUrl}/delete_part_of_kommiTask?belegnummer=${belegnummer}&zeilennummer=${zeilennummer}`
    );
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  getAuftraege(task_type: string): Observable<Auftrag[]> {
    return this.http.get<AuftraegeApiResponse>(`${this.baseUrl}/get_all_kommiTasks?task_type=${task_type}`)
      .pipe(
        map(response => {
          return Object.entries(response.data).map(([belegnummer, data]) => {
            const firstPosition = data.all_positions[0];
            return {
              id: 0, // generieren Sie eine ID falls nötig
              belegnummer: belegnummer,
              auftragsnummer: data.AU_number,
              kunde: firstPosition?.verkauf_an_name || '',
              strasse: firstPosition?.liefer_an_adresse || '',
              plz: firstPosition?.liefer_an_plz_code || '',
              ort: firstPosition?.liefer_an_ort || '',
              lagerist: firstPosition?.lagerist || '',
              lageristRueck: firstPosition?.lagerist_rueck || '',
              positionen: data.all_positions,
              lieferdatum: firstPosition?.lieferdatum ? new Date(firstPosition.lieferdatum) : undefined,
              prioritaet: data.priority,
              erledigt: !data.exist_open_task
            } as Auftrag;
          });
        })
      );
  }
  changePrio(belegnummer: string, prio: number): Observable<{ success: boolean; msg?: string; error?: string }> {
    return this.http.get<{ success: boolean; msg?: string; error?: string }>(
      `${this.baseUrl}/change_prio_kommTask?belegnummer=${belegnummer}&prio=${prio}`
    );
  }

  deleteTask(belegnummer: string): Observable<DeleteTaskResponse> {
    return this.http.get<DeleteTaskResponse>(
      `${this.baseUrl}/delete_completely_kommiTask?belegnummer=${belegnummer}`
    );
  }

  blockKommiTask(belegnummer: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/block_kommiTask`, {
      params: { belegnummer }
    });
  }

  getEinlagerungTasks(): Observable<EinlagerungTask[]> {
    return this.http.get<EinlagerungTasksResponse>(
      `${this.einlagerungUrl}/get_tasks`,
      { headers: new HttpHeaders({ 'accept': '*/*' }) }
    ).pipe(
      map(response => {
        if (!response.success || !response.tasks) {
          return [];
        }
        return response.tasks.map((taskWrapper, index) => {
          // Each task is wrapped in an object with numeric key
          const key = Object.keys(taskWrapper)[0];
          const task = taskWrapper[key];
          return {
            id: index + 1,
            entry_number: task.entry_number,
            abholort: task.abholort,
            basis_menge: task.basis_menge,
            artikelnummer: task.artikelnummer
          } as EinlagerungTask;
        });
      })
    );
  }

  getKdxBoxen(turmNr: number, tablarNr: number): Observable<KdxBoxenResponse> {
    return this.http.get<KdxBoxenResponse>(
      `${this.einlagerungUrl}/get_boxen?turmNr=${turmNr}&tablarNr=${tablarNr}`,
      { headers: new HttpHeaders({ 'accept': '*/*' }) }
    );
  }

  releaseKdxRegal(regalnummer: string): Observable<KdxReleaseResponse> {
    return this.http.get<KdxReleaseResponse>(
      `${this.einlagerungUrl}/release_regal?regalnummer=${regalnummer}`,
      { headers: new HttpHeaders({ 'accept': '*/*' }) }
    );
  }
}