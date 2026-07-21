import { Component, computed, effect, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { RefComment } from '../../models/ref.model';
import { RefsService } from '../../services/refs.service';
import { CommentsService } from '../../services/comments.service';

@Component({
  selector: 'app-ref-detail',
  imports: [FormsModule, RouterLink, Header],
  templateUrl: './ref-detail.html',
  styleUrl: './ref-detail.scss',
})
export class RefDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly refsService = inject(RefsService);
  private readonly commentsService = inject(CommentsService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly refFromRoute = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id')!;
        return this.refsService.getAll().pipe(map((refs) => refs.find((r) => r.id === id)));
      }),
    ),
    { initialValue: undefined },
  );

  readonly ref = this.refFromRoute;

  readonly embedUrl = computed(() => {
    const ref = this.ref();
    if (!ref) return null;

    if (ref.type === 'youtube') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${ref.youtubeId}`,
      );
    }
    if (ref.type === 'instagram') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.instagram.com/reel/${ref.instagramId}/embed`,
      );
    }
    return null;
  });

  private readonly dbComments = signal<RefComment[]>([]);

  readonly comments = computed<RefComment[]>(() => {
    const ref = this.ref();
    if (!ref) return [];
    return [...ref.comments, ...this.dbComments()];
  });

  readonly newComment = signal('');
  readonly posting = signal(false);

  constructor() {
    effect(() => {
      const ref = this.ref();
      if (!ref) {
        this.dbComments.set([]);
        return;
      }
      this.commentsService.getFor(ref.id).subscribe((comments) => this.dbComments.set(comments));
    });
  }

  addComment(): void {
    const ref = this.ref();
    const text = this.newComment().trim();
    if (!ref || !text || this.posting()) return;

    this.posting.set(true);
    this.commentsService.add(ref.id, text).subscribe({
      next: (comment) => {
        this.dbComments.update((comments) => [...comments, comment]);
        this.newComment.set('');
        this.posting.set(false);
      },
      error: () => this.posting.set(false),
    });
  }
}
