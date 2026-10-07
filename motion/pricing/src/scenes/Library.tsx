import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Aircraft, AircraftCabin, Passenger, Seat } from '../components/aircraft';
import { Guest, Hotel, RoomGrid } from '../components/hotel';
import { DemandCurve, DemandIndicator, FareBucket, InventoryCounter, InventoryCurve, PriceCounter, PriceHistory, PriceTag } from '../components/price';
import { AlgorithmNode, Booking, EventMarker, RevenueManager, Timeline } from '../components/system';
import { DataLabel, EditorialTitle, ScientificCallout } from '../components/editorial';
import { flight, hotel, pricingInputs } from '../data/entities';
import { THEME, seg } from '../theme';

/** Contact sheet of every reusable component, fed with the reference data. For review only. */
const Cell: React.FC<{ x: number; y: number; name: string; children: React.ReactNode }> = ({ x, y, name, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 470, height: 260, borderTop: `1px solid ${THEME.faint}` }}>
    <div style={{ fontFamily: THEME.sans, fontSize: 13, letterSpacing: '0.18em', color: THEME.muted, marginTop: 8 }}>{name}</div>
    <div style={{ position: 'absolute', left: 0, top: 34, width: 470, height: 220 }}>{children}</div>
  </div>
);
const S: React.FC<{ w?: number; h?: number; children: React.ReactNode; scale?: number }> = ({ w = 470, h = 220, scale = 1, children }) => (
  <svg width={w} height={h} style={{ overflow: 'visible' }}><g transform={`scale(${scale})`}>{children}</g></svg>
);

export const Library: React.FC = () => {
  const f = useCurrentFrame();
  const col = (i: number) => 40 + i * 475, row = (j: number) => 30 + j * 262;
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <Cell x={col(0)} y={row(0)} name="PRICECOUNTER"><PriceCounter steps={[{ at: 0, value: 287 }, { at: 20, value: 341 }, { at: 50, value: 412 }]} size={110} /></Cell>
      <Cell x={col(1)} y={row(0)} name="PRICETAG · DATALABEL">
        <PriceTag label="Vol" value={flight.price} /><PriceTag label="Hôtel" value={hotel.price} highlight style={{ marginTop: 14 }} />
        <DataLabel label="Taux de remplissage" value={`${Math.round((1 - flight.availableSeats / flight.seats) * 100)} %`} style={{ marginTop: 18 }} />
      </Cell>
      <Cell x={col(2)} y={row(0)} name="DEMANDINDICATOR · INVENTORYCOUNTER">
        <DemandIndicator level={0.78} /><InventoryCounter available={flight.availableSeats} total={flight.seats} unit="sièges" style={{ marginTop: 22 }} />
      </Cell>
      <Cell x={col(3)} y={row(0)} name="FAREBUCKET"><FareBucket buckets={flight.fareBuckets} /></Cell>

      <Cell x={col(0)} y={row(1)} name="AIRCRAFT · PASSENGER · SEAT">
        <S><g transform="translate(10,0)"><Aircraft length={210} /></g><Passenger x={260} y={60} size={60} /><Seat x={360} y={80} size={34} state="booked" /><Seat x={410} y={80} size={34} state="highlight" /></S>
      </Cell>
      <Cell x={col(1)} y={row(1)} name="AIRCRAFTCABIN · SEATGRID"><S scale={0.36}><g transform="rotate(-90) translate(-560,0)"><AircraftCabin seats={flight.seats} available={flight.availableSeats} layout={flight.layout} reveal={seg(f, 0, 40)} /></g></S></Cell>
      <Cell x={col(2)} y={row(1)} name="HOTEL · HOTELFLOOR · HOTELROOM"><S scale={0.42}><g transform="translate(20,40)"><Hotel rooms={hotel.rooms} available={hotel.availableRooms} perFloor={hotel.perFloor} name={hotel.name} /></g></S></Cell>
      <Cell x={col(3)} y={row(1)} name="ROOMGRID · GUEST"><S scale={0.55}><RoomGrid rooms={120} available={9} perFloor={12} /><Guest x={460} y={140} size={70} /></S></Cell>

      <Cell x={col(0)} y={row(2)} name="PRICEHISTORY"><S scale={0.62}><g transform="translate(30,30)"><PriceHistory values={[219, 219, 287, 287, 341, 412, 412, 476]} progress={seg(f, 0, 50)} /></g></S></Cell>
      <Cell x={col(1)} y={row(2)} name="DEMANDCURVE"><S scale={0.6}><g transform="translate(30,30)"><DemandCurve point={0.6} /></g></S></Cell>
      <Cell x={col(2)} y={row(2)} name="INVENTORYCURVE"><S scale={0.62}><g transform="translate(30,30)"><InventoryCurve total={flight.seats} remaining={[180, 172, 160, 141, 118, 96, 71, 42]} /></g></S></Cell>
      <Cell x={col(3)} y={row(2)} name="TIMELINE · EVENTMARKER · BOOKING">
        <S><Timeline x={20} y={160} w={420} ticks={['J-90', 'J-60', 'J-30', 'J-7', 'J-0']} playhead={0.7} /><EventMarker x={300} y={160} label="Salon" h={80} /><Booking from={[40, 40]} to={[200, 150]} at={10} /></S>
      </Cell>

      <Cell x={col(0)} y={row(3)} name="ALGORITHMNODE · REVENUEMANAGER">
        <S scale={0.42}><g transform="translate(560,260)"><RevenueManager cx={0} cy={0} radius={460} centreR={90} inputs={pricingInputs} /><AlgorithmNode x={0} y={0} label="Prix" r={26} strong pulseAt={40} /></g></S>
      </Cell>
      <Cell x={col(1)} y={row(3)} name="EDITORIALTITLE"><EditorialTitle kicker="Scène 01" title="Le prix qui change" size={54} align="left" /></Cell>
      <Cell x={col(2)} y={row(3)} name="SCIENTIFICCALLOUT">
        <div style={{ position: 'relative', width: 470, height: 220 }}><ScientificCallout x={40} y={140} dx={60} dy={-70} text="Le prix suit la demande, pas le coût." /></div>
      </Cell>
      <Cell x={col(3)} y={row(3)} name="SPLITSCREEN · CAMERARIG">
        <div style={{ fontFamily: THEME.sans, fontSize: 16, lineHeight: 1.6, color: THEME.muted }}>Voir la scène 01 : la caméra (PUSH IN, PULL OUT, PAN, ORBIT, SNAP, SLOW PUSH, RAPID PUSH, impact) et l'écran partagé avion | hôtel.</div>
      </Cell>
    </AbsoluteFill>
  );
};
