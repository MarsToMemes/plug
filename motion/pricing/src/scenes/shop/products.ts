import { rng } from '../../theme';
import { KINDS, type Kind } from './garments';

/** Deterministic fake catalogue shared by the shop animations (names, colours, prices). */
export const NAMES: Record<Kind, string> = { tee: 'T-shirt oversize', dress: 'Robe midi plissée', hoodie: 'Sweat à capuche', jeans: 'Jean large taille haute', skirt: 'Jupe satinée', jacket: 'Veste cropped', cami: 'Top à fines bretelles', shorts: 'Short en lin', sweater: 'Pull maille côtelée', bag: 'Sac bandoulière' };
export const BG = ['#EEE8E0', '#E4E8EB', '#F0E5E6', '#E5E9E1', '#F2EDE4', '#E8E3ED', '#ECE9E2'];
export const INK = ['#1F1F22', '#C2453A', '#D9C8B0', '#6B7F99', '#B4876A', '#3D4C40', '#D7A3AD', '#8A2F3A', '#2F4B7C', '#F4F1EA', '#E4B33E'];
export type Product = { kind: Kind; bg: string; color: string; price: number; was: number; sold: number };
/** Integer hash (murmur3 finaliser): decorrelates neighbouring seeds for the linear generator. */
export const mix = (n: number) => { let h = n >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };
export function product(k: number, seed = 9100 + k * 31): Product {
  const r = rng(seed);
  const kind = KINDS[Math.floor(r() * KINDS.length)]!, price = [3.49, 4.99, 5.49, 6.99, 7.99, 8.49, 9.99, 11.99, 12.49, 14.99][Math.floor(r() * 10)]!;
  return { kind, bg: BG[Math.floor(r() * BG.length)]!, color: INK[Math.floor(r() * INK.length)]!, price, was: Math.round(price * (2 + r() * 1.6)) - 0.01, sold: 1 + Math.floor(r() * 99) };
}
export const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
