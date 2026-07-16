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

export interface YoutubeRef extends RefBase {
  type: 'youtube';
  youtubeId: string;
  vertical: boolean;
}

export type Ref = LocalRef | YoutubeRef;
