# Michel Palareff

Vous avez pas la ref ? Maintenant si.

Site perso pour rassembler toutes les vidéos-refs au même endroit : une liste façon feed
Instagram, et une page détail par ref avec lecteur vidéo + description à côté.

## Ajouter une ref

Dépose ton fichier vidéo (`.mp4`, `.webm`, `.mov`, `.m4v`, `.ogg`) dans `public/videos/`. Elle
apparaîtra automatiquement dans le feed au prochain `npm start` / `npm run build` (titre et date
déduits du nom de fichier et de sa date de création).

Pour personnaliser le titre, la date, la description ou ajouter des commentaires, édite
`public/videos-meta.json` — une entrée par nom de fichier exact :

```json
{
  "mon-fichier.mp4": {
    "name": "Nom affiché",
    "date": "2024-05-12",
    "description": "Contexte, punchline, tout ce que tu veux.",
    "script": ["Phrase culte n°1", "Phrase culte n°2"],
    "categories": ["meme", "foot"],
    "comments": [{ "author": "Michel", "text": "Iconique." }]
  }
}
```

Tous les champs sont optionnels ; ce qui n'est pas précisé est déduit automatiquement. `script`
est la liste des phrases cultes dites dans la vidéo — sert uniquement à la recherche (voir
plus bas), rien ne l'affiche directement sur le site. `categories` est une liste libre de tags
(ex : `foot`, `animé`, `jeu-vidéo`, `cinéma`, `humour`, `meme`...) affichés en petit badge sur
la carte et la page détail, et pris en compte par la recherche.

Les visiteurs peuvent aussi ajouter des commentaires depuis le site : ils restent stockés
uniquement dans leur navigateur (`localStorage`), rien n'est envoyé nulle part.

Les vidéos elles-mêmes ne sont jamais commitées (voir `.gitignore`) : c'est un stockage 100%
local, sans backend.

### Ajouter une ref YouTube

Pour une ref qui n'est pas un fichier local mais une vidéo YouTube (short ou classique), édite
`public/youtube-refs.json` — un tableau, une entrée par vidéo :

```json
[
  {
    "url": "https://www.youtube.com/shorts/xxxxxxxxxxx",
    "name": "Nom affiché",
    "date": "2024-05-12",
    "vertical": true,
    "description": "Contexte, punchline, tout ce que tu veux.",
    "script": ["Phrase culte n°1", "Phrase culte n°2"],
    "categories": ["meme", "foot"],
    "comments": [{ "author": "Michel", "text": "Iconique." }]
  }
]
```

`url` accepte un lien `youtube.com/shorts/...`, `youtube.com/watch?v=...` ou `youtu.be/...` (ou
directement un `youtubeId`). `vertical` contrôle le format du lecteur sur la page détail (`true`
pour un short). Comme pour les vidéos locales, tout le reste est optionnel.

### Chercher une ref

La barre de recherche du feed filtre les refs par nom, description et `script` combinés (insensible
à la casse et aux accents). Plus tu remplis `script` avec les répliques cultes d'une vidéo, plus
il est facile de la retrouver en tapant juste un bout de phrase dont tu te souviens.

## Développement

```bash
npm start   # lance le serveur de dev sur http://localhost:4200
npm run build
```

Login de démo : `michel` / `palareff`.

## Déploiement (Docker)

Le site est 100% statique (pas de backend), donc l'image Docker se limite à un build Angular
servi par nginx.

```bash
docker compose up -d --build
```

Le site est alors dispo sur `http://<ton-serveur>:8080`. Le port exposé se change dans
`docker-compose.yml` (`"8080:80"`).

Comme les vidéos sont scannées et intégrées **au moment du build** (`public/videos/`,
`public/videos-meta.json`, `public/youtube-refs.json`), ajouter une nouvelle ref sur le serveur
se fait en déposant le fichier vidéo (ou en éditant les `.json`) puis en relançant :

```bash
docker compose up -d --build
```

Pas de volume à monter, pas d'état à gérer : chaque rebuild régénère le manifest et repart d'une
image propre.
