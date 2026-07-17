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

## Comptes

Il n'y a plus de login codé en dur. N'importe qui peut créer un compte depuis la page de login
(bouton "Pas encore de compte ?") avec juste un pseudo (3-32 caractères) et un mot de passe
(6 caractères minimum) — aucune autre info demandée.

Techniquement : une petite API (`server/`, Node/Express) gère l'inscription/connexion, hash les
mots de passe avec bcrypt, et pose un cookie de session (JWT, httpOnly) valable 30 jours. Les
comptes sont stockés dans une table `michel_palareff_users` d'une base PostgreSQL ou MySQL/MariaDB
que tu fournis toi-même (voir `.env.example`) — la table est créée automatiquement au démarrage
si elle n'existe pas encore, rien d'autre n'est touché dans la base.

## Déploiement (Docker)

Le site comprend deux conteneurs : le front Angular servi par nginx, et l'API d'auth. La base de
données, elle, n'est **pas** conteneurisée ici — tu pointes vers celle qui tourne déjà sur ton
serveur (PostgreSQL en local, MariaDB en prod par exemple).

1. Copie `.env.example` en `.env` et renseigne les infos de connexion à ta base (`DB_CLIENT`,
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) ainsi qu'un `JWT_SECRET` (une vraie
   valeur aléatoire, par ex. `openssl rand -hex 32`).
2. Lance :

```bash
docker compose up -d --build
```

Le site est alors dispo sur `http://<ton-serveur>:6767` (port modifiable dans
`docker-compose.yml`).

Comme les vidéos sont scannées et intégrées **au moment du build** (`public/videos/`,
`public/videos-meta.json`, `public/youtube-refs.json`), ajouter une nouvelle ref se fait en
déposant le fichier vidéo (ou en éditant les `.json`) puis en relançant la même commande. Les
comptes utilisateurs, eux, vivent dans la base et survivent aux rebuilds/redeploys.
