import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { Ref } from '../models/ref.model';

@Injectable({ providedIn: 'root' })
export class RefsService {
  private readonly http = inject(HttpClient);
  private readonly refs$: Observable<Ref[]> = this.http
    .get<Ref[]>('videos-manifest.json')
    .pipe(shareReplay(1));

  getAll(): Observable<Ref[]> {
    return this.refs$;
  }
}
