import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
export interface Position {
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
  start_rueck?: string;
  ende_rueck?: string;
  chargennummer: string;
  tourcode?: string;
  bruttoGewicht?: number;
  anzahl_vollpalette?: number;
  gtin_scann?: number; // 0 = Quickpick, 1 = normaler Scan

  // ... weitere Felder nach Bedarf
}
interface AuftragData {
  AU_number: string;
  delivery_date: string;
  exist_open_task: boolean;
  priority: number;
  all_positions: Position[];
  blocked_by_NAV?: boolean;
  tourcode?: string;
  bruttoGewicht?: number;
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
  menge?: number;
  menge_rueck?: number;
  zu_liefern?: number;
  liefer_an_name?: string;
  chargennummer?: string;
  blocked?: boolean;
  tourcode?: string;
  bruttoGewicht?: number;
}

// Einlagerung Task Interfaces
export interface EinlagerungTask {
  id: number;
  entry_number: number;
  abholort: string;
  basis_menge: number;
  artikelnummer: string;
  lagerist?: string;
}

interface EinlagerungTaskRaw {
  entry_number: number;
  abholort: string;
  basis_menge: number;
  artikelnummer: string;
  lagerist?: string;
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

// Gruppierte Position Interface
export interface GroupedPosition {
  artikelnummer: string;
  beschreibung: string;
  zusatz_beschreibung: string;
  chargennummer?: string;
  menge_rueck: number;
  zu_liefern: number;
  start_rueck: number;
  end_rueck: number;
}

// Auftrag-Fortschritt Interface
export interface AuftragFortschritt {
  comp: number;      // Erledigte Positionen
  notSt: number;     // Nicht gestartete Positionen
  total: number;     // Gesamtanzahl Positionen
  percent: number;   // Prozent erledigt
}

// Auftrag-Status Type
export type AuftragStatus = 'offen' | 'gestartet' | 'erledigt';

// Quickpick Log Interface
export interface QuickpickLog {
  AU_number?: string;
  belegnummer: string;
  artikelnummer: string;
  beschreibung: string;
  menge: number;
  quickpick: boolean;
  lagerist_rueck?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeitstandService {
  private baseUrl = `${environment.apiUrl}/leitstand`;
  private sinBotUrl = `${environment.apiUrl}/single_bottle_kommi`;
  private einlagerungUrl = `${environment.apiUrl}/einlagerung_kdx`;

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

            // Lagerist ermitteln: erst lagerist, dann lagerist_rueck überschreibt
            let lageristResult = '';
            for (const pos of data.all_positions) {
              if (pos.lagerist && pos.lagerist.trim() !== '') {
                lageristResult = pos.lagerist;
                break;
              }
            }
            // lagerist_rueck überschreibt (wer tatsächlich kommissioniert hat)
            for (let i = data.all_positions.length - 1; i >= 0; i--) {
              if (data.all_positions[i].lagerist_rueck && data.all_positions[i].lagerist_rueck.trim() !== '') {
                lageristResult = data.all_positions[i].lagerist_rueck;
                break;
              }
            }

            return {
              id: 0, // generieren Sie eine ID falls nötig
              belegnummer: belegnummer,
              auftragsnummer: data.AU_number,
              kunde: firstPosition?.verkauf_an_name || '',
              strasse: firstPosition?.liefer_an_adresse || '',
              plz: firstPosition?.liefer_an_plz_code || '',
              ort: firstPosition?.liefer_an_ort || '',
              lagerist: lageristResult,
              lageristRueck: firstPosition?.lagerist_rueck || '',
              positionen: data.all_positions,
              lieferdatum: firstPosition?.lieferdatum ? new Date(firstPosition.lieferdatum) : undefined,
              prioritaet: data.priority,
              erledigt: !data.exist_open_task,
              chargennummer: firstPosition?.chargennummer || '',
              blocked: data.blocked_by_NAV === true,
              tourcode: data.tourcode || '',
              bruttoGewicht: data.bruttoGewicht || 0,
              anzahl_vollpalette: firstPosition.anzahl_vollpalette || 0,
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

  releaseKommiTask(belegnummer: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/release_kommiTask`, {
      params: { belegnummer }
    });
  }

  assignLagerist(belegnummer: string, oldUserId: string, newUserId: string): Observable<{ success: boolean; msg?: string }> {
    return this.http.get<{ success: boolean; msg?: string }>(
      `${this.baseUrl}/change_executorUserId_komm`,
      {
        params: {
          belegnummer,
          old_userid: oldUserId || ' ',
          new_userid: newUserId
        },
        headers: new HttpHeaders({ 'accept': '*/*' })
      }
    );
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
            artikelnummer: task.artikelnummer,
            lagerist: task.lagerist
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

  /**
   * Lädt alle Quickpick-Logs (Positionen wo gtin_scann === 0), gruppiert nach Auftrag+Artikel
   */
  getQuickpickLogs(): Observable<QuickpickLog[]> {
    return this.http.get<AuftraegeApiResponse>(`${this.baseUrl}/get_all_kommiTasks?task_type=KOMM`)
      .pipe(
        map(response => {
          // Map für Gruppierung: key = belegnummer|artikelnummer
          const grouped = new Map<string, QuickpickLog>();

          Object.values(response.data).forEach(auftrag => {
            auftrag.all_positions
              .filter(pos => pos.gtin_scann === 0 && pos.lagerist_rueck && pos.lagerist_rueck.trim() !== '')
              .forEach(pos => {
                const key = `${pos.belegnummer}|${pos.artikelnummer}`;
                const existing = grouped.get(key);

                if (existing) {
                  existing.menge += 1;
                } else {
                  grouped.set(key, {
                    AU_number: auftrag.AU_number,
                    belegnummer: pos.belegnummer,
                    artikelnummer: pos.artikelnummer,
                    beschreibung: pos.beschreibung,
                    menge: 1,
                    quickpick: true,
                    lagerist_rueck: pos.lagerist_rueck || ''
                  });
                }
              });
          });

          return Array.from(grouped.values());
        })
      );
  }

  // ============ BUSINESS LOGIC METHODS ============

  /**
   * Ermittelt den Status eines Auftrags
   */
  getAuftragStatus(auftrag: Auftrag): AuftragStatus {
    if (!auftrag.positionen || auftrag.positionen.length === 0) {
      return 'offen';
    }

    // Prüfe ob alle Positionen erledigt sind
    const alleErledigt = auftrag.positionen.every(position =>
      position.menge_rueck > 0 &&
      position.lagerist_rueck &&
      position.lagerist_rueck.trim() !== ''
    );

    if (alleErledigt) {
      return 'erledigt';
    }

    // Prüfe ob mindestens eine Position gestartet wurde
    const hatLagerist = auftrag.positionen.some(position =>
      position.lagerist && position.lagerist.trim() !== ''
    );

    return hatLagerist ? 'gestartet' : 'offen';
  }

  /**
   * Prüft ob Auftrag erledigt ist
   */
  isAuftragErledigt(auftrag: Auftrag): boolean {
    return this.getAuftragStatus(auftrag) === 'erledigt';
  }

  /**
   * Prüft ob Auftrag gestartet ist
   */
  isAuftragGestartet(auftrag: Auftrag): boolean {
    return this.getAuftragStatus(auftrag) === 'gestartet';
  }

  /**
   * Berechnet Fortschritt einer einzelnen Position
   */
  getPositionFortschritt(position: Position | GroupedPosition): string {
    if (position.menge_rueck && position.zu_liefern) {
      const prozent = Math.round((position.menge_rueck / position.zu_liefern) * 100);
      return `${prozent}%`;
    }
    return position.menge_rueck > 0 ? '100%' : '0%';
  }

  /**
   * Berechnet Gesamtfortschritt eines Auftrags
   */
  getAuftragFortschritt(auftrag: Auftrag): AuftragFortschritt {
    if (!auftrag?.positionen?.length) {
      return { comp: 0, notSt: 0, total: 0, percent: 0 };
    }

    let comp = 0;
    let notSt = 0;

    for (const pos of auftrag.positionen) {
      const fortschritt = this.getPositionFortschritt(pos);
      if (fortschritt === '100%') {
        comp++;
      } else if (fortschritt === '0%') {
        notSt++;
      }
    }

    return {
      comp,
      notSt,
      total: auftrag.positionen.length,
      percent: auftrag.positionen.length > 0
        ? Math.round((comp / auftrag.positionen.length) * 100)
        : 0
    };
  }

  /**
   * Berechnet Gesamtmenge (zu_liefern) eines Auftrags
   */
  getAuftragMenge(auftrag: Auftrag): number {
    if (!auftrag?.positionen?.length) {
      return 0;
    }
    return auftrag.positionen.reduce((sum, pos) => sum + (pos.zu_liefern || 0), 0);
  }

  /**
   * Berechnet Pick-Menge (menge_rueck) eines Auftrags
   */
  getAuftragPickMenge(auftrag: Auftrag): number {
    if (!auftrag?.positionen?.length) {
      return 0;
    }
    return auftrag.positionen.reduce((sum, pos) => sum + (pos.menge_rueck || 0), 0);
  }

  /**
   * Berechnet Anzahl Paletten eines Auftrags
   */
  getPalettenAnzahl(auftrag: Auftrag): number {
    if (!auftrag?.positionen?.length) {
      return 0;
    }
    return auftrag.positionen.reduce((sum, pos) => sum + (pos.anzahl_vollpalette || 0), 0);
  }

  /**
   * Berechnet Anzahl Packhilfen eines Auftrags
   * TODO: Implementierung wenn Datenfeld bekannt
   */
  getPackhilfenAnzahl(_auftrag: Auftrag): number {
    return 0;
  }

  /**
   * Gruppiert Positionen nach Artikelnummer und summiert Mengen
   */
  getGroupedPositions(auftrag: Auftrag): GroupedPosition[] {
    if (!auftrag?.positionen?.length) {
      return [];
    }

    const grouped = new Map<string, GroupedPosition>();

    for (const pos of auftrag.positionen) {
      const key = pos.artikelnummer;
      const existing = grouped.get(key);

      if (existing) {
        existing.menge_rueck += pos.menge_rueck || 0;
        existing.zu_liefern += pos.zu_liefern || 0;
      } else {
        grouped.set(key, {
          artikelnummer: pos.artikelnummer,
          beschreibung: pos.beschreibung,
          zusatz_beschreibung: pos.zusatz_beschreibung,
          chargennummer: pos.chargennummer,
          menge_rueck: pos.menge_rueck || 0,
          zu_liefern: pos.zu_liefern || 0,
          start_rueck: (pos as any).start_rueck || 0,
          end_rueck: (pos as any).end_rueck || 0
        });
      }
    }

    return Array.from(grouped.values());
  }
}