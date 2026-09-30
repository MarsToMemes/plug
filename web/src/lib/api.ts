// Client of the Plug API (server/). In development Vite proxies /api to the server.

export type Pacing = 'calm' | 'standard' | 'dynamic';
export type EditStyle = 'apple' | 'default';
export type VoiceMode = 'tts' | 'upload' | 'none';
export type MediaRole = 'visual' | 'voice' | 'music';
/** What a visual is: the engine prefers the most authentic (studio-engine bible §27). */
export type MediaNature = 'real_video' | 'real_photo' | 'archive' | 'screenshot' | 'document' | 'generated';
export const NATURE_LABEL: Record<MediaNature, string> = {
  real_video: 'Vidéo réelle',
  real_photo: 'Photo réelle',
  archive: 'Archive',
  screenshot: "Capture d'écran",
  document: 'Document',
  generated: 'Généré par IA'
};
export const NATURES_OF: Record<'image' | 'video', MediaNature[]> = {
  video: ['real_video', 'generated'],
  image: ['real_photo', 'archive', 'screenshot', 'document', 'generated']
};

export interface ProjectMedia {
  id: string;
  role: MediaRole;
  kind: 'image' | 'video' | 'audio';
  file: string;
  originalName: string;
  bytes: number;
  width?: number;
  height?: number;
  durationInSeconds?: number;
  description: string;
  tags: string[];
  nature?: MediaNature;
  /** Projects made before `nature`. */
  synthetic?: boolean;
  /** The user chose the nature: Claude's guess never replaces it. */
  natureSet?: boolean;
  /** Claude's automatic description. */
  auto?: { status: 'pending' | 'done' | 'failed'; error?: string };
}

export const INTENTS = ['hook', 'context', 'fact', 'important_fact', 'keyword', 'number', 'statistic', 'comparison', 'quote', 'proof', 'location', 'process', 'contradiction', 'revelation', 'aftermath', 'chapter', 'conclusion'] as const;
export type Intent = (typeof INTENTS)[number];
export const INTENT_LABEL: Record<Intent, string> = {
  hook: 'Accroche', context: 'Contexte', fact: 'Fait', important_fact: 'Fait important', keyword: 'Mot-clé', number: 'Nombre',
  statistic: 'Statistique', comparison: 'Comparaison', quote: 'Citation', proof: 'Preuve', location: 'Lieu', process: 'Processus',
  contradiction: 'Contradiction', revelation: 'Révélation', aftermath: 'Conséquence', chapter: 'Chapitre', conclusion: 'Conclusion'
};
export const MEDIA_NEEDS = ['explain_number', 'show_relation', 'connect_concepts', 'abstract_mechanism', 'historical_context', 'introduce_entity', 'archival_evidence', 'human_behavior', 'product_in_use', 'atmosphere', 'platform_reference', 'financial_document', 'source_interface', 'none'] as const;
export type MediaNeed = (typeof MEDIA_NEEDS)[number];
export const NEED_LABEL: Record<MediaNeed, string> = {
  explain_number: 'Expliquer un chiffre', show_relation: 'Montrer une relation', connect_concepts: 'Relier des idées', abstract_mechanism: 'Mécanisme abstrait',
  historical_context: 'Contexte historique', introduce_entity: 'Présenter une personne, une marque', archival_evidence: 'Preuve d’archive',
  human_behavior: 'Comportement humain', product_in_use: 'Produit utilisé', atmosphere: 'Ambiance', platform_reference: 'Plateforme citée',
  financial_document: 'Document financier', source_interface: 'Source, interface', none: 'Aucun (texte seul)'
};

/** What the author sets on one sentence of the script (studio-engine UnitHints). */
export interface SentenceHints {
  intent?: Intent;
  mediaNeed?: MediaNeed;
  media?: string;
  mediaStart?: number;
  chart?: { kind: 'barChart' | 'lineChart' | 'pieChart'; labels: string[]; values: number[]; unit?: string; title?: string; source?: string };
  share?: { value: number; of?: number; label?: string };
  source?: string;
  documentCard?: { header?: string; heading?: string; sentence: string; rows?: Array<[string, string]> };
  strike?: string;
}

/** Lines are matched on their text, spaces normalised (as on the server). */
export const hintKey = (line: string) => line.trim().replace(/\s+/g, ' ');

export interface Job {
  id: string;
  kind: 'direct' | 'stills' | 'render';
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  message: string;
  error?: string;
  finishedAt?: string;
}

export interface Issue { message: string; rule?: string }

export interface RenderInfo {
  id?: string;
  /** File in the project folder (video.mp4 for renders made before versions). */
  file?: string;
  poster?: string;
  createdAt: string;
  planCreatedAt: string;
  durationInSeconds: number;
  shots?: number;
  style?: EditStyle;
  draft: boolean;
  scale: number;
  loudness?: { integrated: number; truePeak: number };
  qc?: { pass: boolean; failed: string[]; warnings: string[] };
  notes: string[];
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  script: string;
  pacing: Pacing;
  style?: EditStyle;
  captions: boolean;
  llm: boolean;
  voice: { mode: VoiceMode; voiceId?: string };
  rightsConfirmed: boolean;
  media: ProjectMedia[];
  /** Hints by script line. */
  hints?: Record<string, SentenceHints>;
  voiceTrack?: { durationInSeconds: number; timing: 'tts' | 'stt' | 'aligned'; words: number };
  plan?: {
    createdAt: string;
    shots: number;
    durationInSeconds: number;
    valid: boolean;
    brain: 'llm' | 'heuristic';
    /** Script line of each sentence (unit id → line). */
    units?: Record<string, string>;
    decisions: string[];
    assetRequests: Array<{ unitId: string; need: string; description: string }>;
    errors: Issue[];
    warnings: Issue[];
    notes: string[];
  };
  stills?: { createdAt: string; planCreatedAt: string };
  render?: RenderInfo;
  /** The last renders, newest first. */
  renders?: RenderInfo[];
  job?: Job;
}

export interface Health {
  ok: boolean;
  elevenLabs: boolean;
  anthropic: boolean;
  studioBlocks: boolean;
  engineBuilt: boolean;
}

/** The fields of a shot the editor shows (ShotPlan of studio-engine). */
export interface PlanShot {
  id: string;
  type: string;
  durationInFrames: number;
  text?: string;
  block?: { item: string; variables?: Record<string, unknown> };
  media?: string;
  skill?: string;
  editorialIntent?: string;
  /** Level of the authenticity scale used (bible §27). */
  mediaTier?: 'real_video' | 'real_photo' | 'document' | 'data_viz' | 'generated' | 'motion';
  /** Why each decision was taken (shot, motion, camera, sfx…). */
  reasons?: Record<string, string>;
  /** `unit`: the sentence the shot belongs to. */
  metadata?: { unit?: string };
}

export interface Plan { fps: number; shots: PlanShot[] }

export type ProjectPatch = Partial<Pick<Project, 'title' | 'script' | 'pacing' | 'style' | 'captions' | 'llm' | 'voice' | 'rightsConfirmed'>>;

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new Error('Serveur Plug injoignable. Lancez-le avec « npm start » dans server/.');
  }
  if (res.status === 204) return undefined as T;
  // Another program on the API's port answers with HTML, not Plug's JSON.
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error(res.status === 502 || res.status === 504
      ? 'Serveur Plug injoignable. Relancez Plug (icône du Bureau, ou « npm start » dans server/).'
      : 'Le programme qui répond sur le port de l’API n’est pas le serveur Plug. Relancez Plug avec l’icône du Bureau : elle choisit un port libre.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  health: () => call<Health>('/api/health'),
  list: () => call<Project[]>('/api/projects'),
  create: (fields: ProjectPatch) => call<Project>('/api/projects', json('POST', fields)),
  get: (id: string) => call<Project>(`/api/projects/${id}`),
  update: (id: string, fields: ProjectPatch) => call<Project>(`/api/projects/${id}`, json('PATCH', fields)),
  remove: (id: string) => call<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  /** Upload with real progress (XMLHttpRequest: fetch has no upload progress). */
  upload: (id: string, file: File, role: MediaRole, onProgress?: (fraction: number) => void) =>
    new Promise<Project>((resolve, reject) => {
      const form = new FormData();
      form.set('role', role);
      form.set('file', file); // the file last: the server reads the fields before it
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/api/projects/${id}/media`);
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
      xhr.onerror = () => reject(new Error('Serveur Plug injoignable.'));
      xhr.onload = () => {
        let body: { error?: string } = {};
        try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as Project);
        else reject(new Error(body.error ?? `Erreur ${xhr.status}`));
      };
      xhr.send(form);
    }),
  updateMedia: (id: string, mediaId: string, fields: { description?: string; nature?: MediaNature; role?: 'voice' | 'music' }) => call<Project>(`/api/projects/${id}/media/${mediaId}`, json('PATCH', fields)),
  describeMedia: (id: string, mediaId: string) => call<Project>(`/api/projects/${id}/media/${mediaId}/describe`, { method: 'POST' }),
  hints: (id: string, line: string, hints: SentenceHints | null) => call<Project>(`/api/projects/${id}/hints`, json('PUT', { line, hints })),
  removeMedia: (id: string, mediaId: string) => call<Project>(`/api/projects/${id}/media/${mediaId}`, { method: 'DELETE' }),
  direct: (id: string) => call<Job>(`/api/projects/${id}/direct`, { method: 'POST' }),
  stills: (id: string) => call<Job>(`/api/projects/${id}/stills`, { method: 'POST' }),
  render: (id: string, quality: 'preview' | 'final') => call<Job>(`/api/projects/${id}/render`, json('POST', { quality })),
  plan: (id: string) => call<Plan>(`/api/projects/${id}/plan`),
  fileUrl: (id: string, name: string, version?: string) => `${BASE}/api/projects/${id}/files/${name}${version ? `?v=${encodeURIComponent(version)}` : ''}`,
  mediaUrl: (id: string, file: string) => `${BASE}/api/projects/${id}/files/media/${encodeURIComponent(file)}`
};

export const jobActive = (p?: Project) => !!p?.job && (p.job.status === 'queued' || p.job.status === 'running');
