import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RefComment } from '../models/ref.model';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);

  getFor(refId: string): Observable<RefComment[]> {
    return this.http.get<RefComment[]>(`/api/refs/${refId}/comments`, { withCredentials: true });
  }

  add(refId: string, text: string): Observable<RefComment> {
    return this.http.post<RefComment>(
      `/api/refs/${refId}/comments`,
      { text },
      { withCredentials: true },
    );
  }
}
