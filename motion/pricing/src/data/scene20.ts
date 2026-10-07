/**
 * Scene 20 — Le billet à 219 € (narration 8:09.6–8:25.0). The price on a ticket looks like a label
 * ("ce billet coûte 219 €"); it is not: it becomes the centre of the machine (scene 17).
 * Built on the narration's own timing: v(second) -> frame.
 */
const v = (sec: number) => Math.round((sec - 489.6) * 30);
export const S20 = {
  duration: v(505.0),
  card: { x: 610, y: 300, w: 700, h: 400 },
  beats: {
    draw: v(489.8), kicker: v(491.0), details: v(492.0), // "c'est probablement la partie la plus importante"
    price: v(494.4), route: v(495.7), // "quand vous voyez un prix de 219 € sur un billet d'avion"
    quote: v(498.8), // "« ce billet coûte 219 € »"
    strike: v(503.3), // "ce n'est pas vraiment ça"
    become: v(504.2), // "le système dit plutôt…" -> the price goes to the centre of the machine
  },
  price: 219,
  text: { kicker: 'Billet', route: 'Paris → New York', seat: 'Siège 23C', quote: '« Ce billet coûte 219 € »', centre: 'Prix' },
};
