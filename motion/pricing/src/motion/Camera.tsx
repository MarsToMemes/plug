import React from 'react';

/**
 * Virtual camera with depth. A <Camera> holds a pose (pan x/y in px, zoom, roll in degrees);
 * each <Layer> sits at a depth: 1 = the plane the camera frames, < 1 = background (moves less),
 * > 1 = foreground (moves more). That difference IS the parallax.
 */
/** pan x/y (px), zoom, roll (deg), and the pivot: the screen point that a zoom keeps fixed. */
export type CamPose = { x: number; y: number; zoom: number; roll: number; px?: number; py?: number };
const Ctx = React.createContext<CamPose>({ x: 0, y: 0, zoom: 1, roll: 0 });

export const Camera: React.FC<{ pose: CamPose; children: React.ReactNode }> = ({ pose, children }) => (
  <Ctx.Provider value={pose}>
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>{children}</div>
  </Ctx.Provider>
);

export const Layer: React.FC<{ depth?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ depth = 1, children, style }) => {
  const c = React.useContext(Ctx);
  const zoom = 1 + (c.zoom - 1) * depth;
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${c.px ?? 960}px ${c.py ?? 540}px`, transform: `rotate(${c.roll * depth}deg) scale(${zoom}) translate(${-c.x * depth}px, ${-c.y * depth}px)`, ...style }}>
      {children}
    </div>
  );
};
