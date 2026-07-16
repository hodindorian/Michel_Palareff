// Scanne public/videos/ (mp4 locaux) + public/youtube-refs.json (refs YouTube),
// croise avec public/videos-meta.json (overrides manuels des locaux)
// et écrit public/videos-manifest.json, consommé au runtime par RefsService.
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const videosDir = join(rootDir, 'public', 'videos');
const metaPath = join(rootDir, 'public', 'videos-meta.json');
const youtubeRefsPath = join(rootDir, 'public', 'youtube-refs.json');
const manifestPath = join(rootDir, 'public', 'videos-manifest.json');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogg']);

function loadJson(path, label) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    console.warn(`[refs:scan] ${label} illisible, ignoré.`);
    return null;
  }
}

function humanizeName(filename) {
  const stem = basename(filename, extname(filename));
  const words = stem.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractYoutubeId(entry) {
  if (entry.youtubeId) return entry.youtubeId;
  const url = entry.url ?? '';
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function buildLocalRefs() {
  if (!existsSync(videosDir)) {
    console.warn(`[refs:scan] Dossier public/videos introuvable, aucune ref locale.`);
    return [];
  }

  const meta = loadJson(metaPath, 'videos-meta.json') ?? {};
  const files = readdirSync(videosDir).filter((f) => VIDEO_EXTENSIONS.has(extname(f).toLowerCase()));

  return files.map((filename) => {
    const stats = statSync(join(videosDir, filename));
    const override = meta[filename] ?? {};
    const fallbackDate = (stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime)
      .toISOString()
      .slice(0, 10);

    return {
      type: 'local',
      id: slugify(basename(filename, extname(filename))),
      filename,
      videoUrl: `videos/${filename}`,
      name: override.name ?? humanizeName(filename),
      date: override.date ?? fallbackDate,
      description:
        override.description ?? "Description à venir. Michel n'a pas encore trouvé l'inspiration.",
      script: override.script ?? [],
      categories: override.categories ?? [],
      comments: override.comments ?? [],
    };
  });
}

function buildYoutubeRefs() {
  const entries = loadJson(youtubeRefsPath, 'youtube-refs.json');
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const youtubeId = extractYoutubeId(entry);
      if (!youtubeId) {
        console.warn(`[refs:scan] Impossible d'extraire l'ID YouTube de "${entry.url ?? entry.id}", ref ignorée.`);
        return null;
      }

      return {
        type: 'youtube',
        id: entry.id ?? `yt-${slugify(youtubeId)}`,
        youtubeId,
        vertical: entry.vertical ?? true,
        name: entry.name ?? 'Nom à venir',
        date: entry.date ?? new Date().toISOString().slice(0, 10),
        description:
          entry.description ?? "Description à venir. Michel n'a pas encore trouvé l'inspiration.",
        script: entry.script ?? [],
        categories: entry.categories ?? [],
        comments: entry.comments ?? [],
      };
    })
    .filter((ref) => ref !== null);
}

function main() {
  const refs = [...buildLocalRefs(), ...buildYoutubeRefs()];
  refs.sort((a, b) => b.date.localeCompare(a.date));

  writeFileSync(manifestPath, JSON.stringify(refs, null, 2));
  console.log(`[refs:scan] ${refs.length} ref(s) trouvée(s), manifest régénéré.`);
}

main();
