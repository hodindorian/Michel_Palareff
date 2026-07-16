import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { RefComment } from '../../models/ref.model';
import { RefsService } from '../../services/refs.service';
import { LocalCommentsService } from '../../services/local-comments.service';

@Component({
  selector: 'app-ref-detail',
  imports: [FormsModule, RouterLink, Header],
  templateUrl: './ref-detail.html',
  styleUrl: './ref-detail.scss',
})
export class RefDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly refsService = inject(RefsService);
  private readonly localComments = inject(LocalCommentsService);
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
    if (!ref || ref.type !== 'youtube') return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${ref.youtubeId}`,
    );
  });

  private readonly localCommentsBump = signal(0);

  readonly comments = computed<RefComment[]>(() => {
    const ref = this.ref();
    this.localCommentsBump();
    if (!ref) return [];
    return [...ref.comments, ...this.localComments.getFor(ref.id)];
  });

  readonly newComment = signal('');

  addComment(): void {
    const ref = this.ref();
    const text = this.newComment().trim();
    if (!ref || !text) return;

    this.localComments.add(ref.id, { author: 'Toi', text });
    this.newComment.set('');
    this.localCommentsBump.update((n) => n + 1);
  }
}
