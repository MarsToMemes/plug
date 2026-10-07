# Documentaire « Le prix qui change » — tarification dynamique

Projet Remotion. Style : documentaire premium, motion design éditorial, infographie économique.

## Organisation

- `src/data/` : **toutes les données** (prix, capacités, timings des scènes, plans de caméra). Les composants ne contiennent aucun chiffre.
  - `entities.ts` : vol (180 sièges, 42 disponibles, 219 €), hôtel (200 chambres, 17 disponibles, 249 €), classes tarifaires, entrées du système de prix.
  - `scene01.ts` : battements, prix successifs, caméra de la scène 01.
- `src/camera/CameraRig.tsx` : grammaire de caméra commune (PUSH_IN, PULL_OUT, PAN, ORBIT, SNAP, SLOW_PUSH, RAPID_PUSH, impact). Chaque mouvement a un sens, une durée et une courbe fixes.
- `src/components/` : composants réutilisables.
  - `price.tsx` : PriceCounter, PriceTag, DemandIndicator, InventoryCounter, PriceHistory, DemandCurve, InventoryCurve, FareBucket
  - `aircraft.tsx` : Aircraft, AircraftCabin, Seat, SeatGrid, Passenger
  - `hotel.tsx` : Hotel, HotelFloor, HotelRoom, RoomGrid, Guest
  - `system.tsx` : AlgorithmNode, RevenueManager, Timeline, EventMarker, Booking
  - `editorial.tsx` : EditorialTitle, DataLabel, ScientificCallout, SplitScreen
- `src/scenes/` : `Scene01`, `Scene02` (+ `layout02.ts`, géométrie calculée depuis les capacités) et `Library` (planche de tous les composants, pour relecture).

Les chiffres sont illustratifs : ils montrent le mécanisme, ce ne sont pas des tarifs relevés.

## Rendu

```bash
cd motion/pricing
ln -s ../../engine/node_modules node_modules
COMP=Scene01 node render.mjs out/scene01.mp4
COMP=Library node render.mjs out stills 89
```
