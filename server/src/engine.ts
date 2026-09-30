/**
 * studio-engine (git submodule `engine/`), built with `npm run setup-engine`.
 * Imported from its dist/ folders: the packages are not published, and their
 * own dependencies (Remotion, the Anthropic SDK…) resolve from engine/node_modules.
 */
export {
  directEpisode,
  directEpisodeWithLlm,
  AnthropicModel,
  splitSentences,
  type BrainInput,
  type BrainResult,
  type ScriptBlock,
  type CatalogEntry,
  type AssetRequest,
  type LlmReport,
} from '../../engine/packages/editor-brain/dist/index.js';
export {
  renderEpisode,
  resolveFfmpeg,
  runFfmpeg,
  ffprobeJson,
  ffmpegFilters,
  measureLoudness,
  qcEpisode,
  pruneCache,
  type FfmpegTools,
  type RenderEvent,
  type RenderResult,
} from '../../engine/packages/render/dist/index.js';
export {
  EDITORIAL_INTENTS,
  MEDIA_NEEDS,
  LOUDNESS_TARGETS,
  loudnormSecondPass,
  type Asset,
  type AssetRegistry,
  type AssetSource,
  type ShotPlan,
  type TranscriptWord,
  type QcReport,
} from '../../engine/packages/engine/dist/index.js';
