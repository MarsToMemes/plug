import { faBed, faCalendarDays, faChartLine, faClock, faHotel, faPlane } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Icon } from '../components/Icon';
import { THEME } from '../theme';

/** Check: Font Awesome icons rendered as SVG at documentary scale. */
export const IconCheck: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 96 }}>
    {[faPlane, faHotel, faBed, faClock, faCalendarDays, faChartLine].map((i) => <Icon key={i.iconName} icon={i} size={120} color={i === faChartLine ? THEME.accent : THEME.ink} />)}
  </AbsoluteFill>
);
