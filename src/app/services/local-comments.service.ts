import { Injectable } from '@angular/core';

import { RefComment } from '../models/ref.model';

const STORAGE_KEY = 'mp_local_comments';

type LocalCommentsStore = Record<string, RefComment[]>;

@Injectable({ providedIn: 'root' })
export class LocalCommentsService {
  private read(): LocalCommentsStore {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private write(store: LocalCommentsStore): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  getFor(refId: string): RefComment[] {
    return this.read()[refId] ?? [];
  }

  add(refId: string, comment: RefComment): void {
    const store = this.read();
    store[refId] = [...(store[refId] ?? []), comment];
    this.write(store);
  }
}
