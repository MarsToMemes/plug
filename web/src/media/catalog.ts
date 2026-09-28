// Every piece of example media used on the site lives here.
// Swap an id to change a picture everywhere it is used.
//
// Files are self-hosted under /public/media (run `npm run fetch-media`).
// Until they are downloaded, the original Unsplash / Mixkit URLs are used.

export const PHOTOS = {
  tokyo: '1540959733332-eab4deabeeaf',
  walk: '1503899036084-c55cdd92da26',
  food: '1554797589-7241bb691973',
  city: '1542051841857-5f90071e7989',
  temple: '1528164344705-47542687000d',
  tower: '1480796927426-f609979314bd',
  crossing: '1513407030348-c983a97b98d8',
  street: '1492571350019-22de08371fd3',
  alley: '1536098561742-ca998e48cbcc',
  concert: '1470225620780-dba8ba36b745',
  cinema: '1478720568477-152d9b164e26',
  studio: '1533174072545-7a4b6ad7a6c3',
  travel: '1492691527719-9d1e07e534b4',
  neon: '1574717024653-61fd2cf4d44d'
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/** Widths that are downloaded; a request is served by the smallest bucket that is large enough. */
export const PHOTO_SIZES = [360, 720, 1400] as const;

export const VIDEOS = {
  nightStreet: 4231,
  crossing: 4383,
  tokyo: 4308
} as const;

export type VideoKey = keyof typeof VIDEOS;

let local = false;

/** Reads /media/manifest.json (written by scripts/fetch-media.mjs) to know whether files are self-hosted. */
export async function initMedia(): Promise<void> {
  try {
    const r = await fetch('/media/manifest.json', { cache: 'no-store' });
    if (!r.ok) return;
    const m = await r.json();
    local = m && m.ok === true;
  } catch {
    local = false;
  }
}

const bucket = (w: number) => PHOTO_SIZES.find(s => s >= w) ?? PHOTO_SIZES[PHOTO_SIZES.length - 1];

export const photoRemote = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop`;

/** URL of a photo at (at least) the given display width. */
export function photo(key: PhotoKey, w = 720): string {
  const id = PHOTOS[key], b = bucket(w);
  return local ? `/media/photos/${id}-${b}.jpg` : photoRemote(id, b);
}

export const videoRemote = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
export const videoPosterRemote = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`;

export function video(key: VideoKey): string {
  const id = VIDEOS[key];
  return local ? `/media/videos/${id}-720.mp4` : videoRemote(id);
}

export function videoPoster(key: VideoKey): string {
  const id = VIDEOS[key];
  return local ? `/media/videos/${id}-poster.jpg` : videoPosterRemote(id);
}
