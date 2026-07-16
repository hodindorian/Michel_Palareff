import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Header } from '../../shared/header/header';
import { Ref } from '../../models/ref.model';
import { RefsService } from '../../services/refs.service';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function matches(ref: Ref, query: string): boolean {
  const haystack = normalize(
    [ref.name, ref.description, ...ref.script, ...ref.categories].join(' '),
  );
  return haystack.includes(query);
}

export const ALL_CATEGORIES = 'TOUT';

@Component({
  selector: 'app-feed',
  imports: [RouterLink, FormsModule, Header],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
})
export class Feed {
  private readonly refsService = inject(RefsService);
  private readonly refs = toSignal(this.refsService.getAll(), { initialValue: undefined });

  readonly query = signal('');
  readonly selectedCategory = signal<string>(ALL_CATEGORIES);

  readonly categories = computed(() => {
    const refs = this.refs();
    if (!refs) return [];

    const unique = new Set<string>();
    for (const ref of refs) {
      for (const category of ref.categories) unique.add(category);
    }
    return [ALL_CATEGORIES, ...[...unique].sort()];
  });

  readonly filteredRefs = computed(() => {
    const refs = this.refs();
    if (!refs) return undefined;

    const category = this.selectedCategory();
    const query = normalize(this.query().trim());

    return refs.filter((ref) => {
      const inCategory = category === ALL_CATEGORIES || ref.categories.includes(category);
      const inQuery = !query || matches(ref, query);
      return inCategory && inQuery;
    });
  });
}
