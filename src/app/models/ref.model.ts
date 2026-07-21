export interface RefComment {
  author: string;
  text: string;
}

interface RefBase {
  id: string;
  name: string;
  date: string;
  description: string;
  script: string[];
  categories: string[];
  comments: RefComment[];
}

export interface LocalRef extends RefBase {
  type: 'local';
  filename: string;
  videoUrl: string;
}

export interface PhotoRef extends RefBase {
  type: 'photo';
  filename: string;
  imageUrl: string;
}

export interface YoutubeRef extends RefBase {
  type: 'youtube';
  youtubeId: string;
  vertical: boolean;
}

export interface InstagramRef extends RefBase {
  type: 'instagram';
  instagramId: string;
  vertical: boolean;
}

export type Ref = LocalRef | PhotoRef | YoutubeRef | InstagramRef;
