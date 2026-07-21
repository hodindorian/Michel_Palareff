// Scanne public/videos/ + public/pictures/ (fichiers locaux), croise avec
// public/videos-meta.json et public/pictures-meta.json (overrides manuels),
// ajoute public/youtube-refs.json et public/instagram-refs.json (refs distantes),
// et écrit public/videos-manifest.json, consommé au runtime par RefsService.
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const videosDir = join(rootDir, 'public', 'videos');
const picturesDir = join(rootDir, 'public', 'pictures');
const videosMetaPath = join(rootDir, 'public', 'videos-meta.json');
const picturesMetaPath = join(rootDir, 'public', 'pictures-meta.json');
const youtubeRefsPath = join(rootDir, 'public', 'youtube-refs.json');
const instagramRefsPath = join(rootDir, 'public', 'instagram-refs.json');
const manifestPath = join(rootDir, 'public', 'videos-manifest.json');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogg']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

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

function extractInstagramId(entry) {
  if (entry.instagramId) return entry.instagramId;
  const url = entry.url ?? '';
  const patterns = [/instagram\.com\/reels?\/([a-zA-Z0-9_-]+)/, /instagram\.com\/p\/([a-zA-Z0-9_-]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function buildLocalFileRefs({ dir, dirLabel, extensions, metaPath, metaLabel, type, urlField, urlPrefix }) {
  if (!existsSync(dir)) {
    console.warn(`[refs:scan] Dossier ${dirLabel} introuvable, aucune ref.`);
    return [];
  }

  const meta = loadJson(metaPath, metaLabel) ?? {};
  const files = readdirSync(dir).filter((f) => extensions.has(extname(f).toLowerCase()));

  return files.map((filename) => {
    const stats = statSync(join(dir, filename));
    const override = meta[filename] ?? {};
    const fallbackDate = (stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime)
      .toISOString()
      .slice(0, 10);

    return {
      type,
      id: slugify(basename(filename, extname(filename))),
      filename,
      [urlField]: `${urlPrefix}/${filename}`,
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

function buildLocalRefs() {
  return buildLocalFileRefs({
    dir: videosDir,
    dirLabel: 'public/videos',
    extensions: VIDEO_EXTENSIONS,
    metaPath: videosMetaPath,
    metaLabel: 'videos-meta.json',
    type: 'local',
    urlField: 'videoUrl',
    urlPrefix: 'videos',
  });
}

function buildPhotoRefs() {
  return buildLocalFileRefs({
    dir: picturesDir,
    dirLabel: 'public/pictures',
    extensions: IMAGE_EXTENSIONS,
    metaPath: picturesMetaPath,
    metaLabel: 'pictures-meta.json',
    type: 'photo',
    urlField: 'imageUrl',
    urlPrefix: 'pictures',
  });
}

function buildRemoteRefs({ refsPath, refsLabel, extractId, type, idField, idPrefix, defaultVertical }) {
  const entries = loadJson(refsPath, refsLabel);
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const remoteId = extractId(entry);
      if (!remoteId) {
        console.warn(`[refs:scan] Impossible d'extraire l'ID de "${entry.url ?? entry.id}" (${refsLabel}), ref ignorée.`);
        return null;
      }

      return {
        type,
        id: entry.id ?? `${idPrefix}-${slugify(remoteId)}`,
        [idField]: remoteId,
        vertical: entry.vertical ?? defaultVertical,
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

function buildYoutubeRefs() {
  return buildRemoteRefs({
    refsPath: youtubeRefsPath,
    refsLabel: 'youtube-refs.json',
    extractId: extractYoutubeId,
    type: 'youtube',
    idField: 'youtubeId',
    idPrefix: 'yt',
    defaultVertical: true,
  });
}

function buildInstagramRefs() {
  return buildRemoteRefs({
    refsPath: instagramRefsPath,
    refsLabel: 'instagram-refs.json',
    extractId: extractInstagramId,
    type: 'instagram',
    idField: 'instagramId',
    idPrefix: 'ig',
    defaultVertical: true,
  });
}

function main() {
  const refs = [...buildLocalRefs(), ...buildPhotoRefs(), ...buildYoutubeRefs(), ...buildInstagramRefs()];
  refs.sort((a, b) => b.date.localeCompare(a.date));

  writeFileSync(manifestPath, JSON.stringify(refs, null, 2));
  console.log(`[refs:scan] ${refs.length} ref(s) trouvée(s), manifest régénéré.`);
}

main();
