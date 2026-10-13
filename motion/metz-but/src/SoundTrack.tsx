import React from 'react';
import {Html5Audio as Audio, Sequence, interpolate, staticFile} from 'remotion';

// Musique fournie par l'utilisateur (Epidemic Sound, sous sa licence) : le drop du morceau (158,13 s)
// tombe sur la coupe « METZ » plein cadre (f15). trimBefore = 157,63 s × 30 i/s.
const MUSIC_TRIM = 4729;

// Effets sonores synthétisés par tools/sfx.py, calés sur les coupes de la carte (frames à 30 i/s).
export const SoundTrack: React.FC = () => (
		<>
			<Audio
				src={staticFile('music/def-lev-hip-hop-rock-song.mp3')}
				trimBefore={MUSIC_TRIM}
				volume={(f) => interpolate(f, [0, 286, 299], [0.42, 0.42, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
			/>
			<Sequence name="SFX lettres" from={2} layout="none">
				<Audio src={staticFile('sfx/whoosh-lettres.wav')} volume={0.39} />
			</Sequence>
			<Sequence name="SFX METZ" from={15} layout="none">
				<Audio src={staticFile('sfx/impact-metz.wav')} volume={0.59} />
			</Sequence>
			<Sequence name="SFX glitch" from={22} layout="none">
				<Audio src={staticFile('sfx/glitch.wav')} volume={0.32} />
			</Sequence>
			<Sequence name="SFX BUUUT" from={27} layout="none">
				<Audio src={staticFile('sfx/impact-but.wav')} volume={0.66} />
			</Sequence>
			<Sequence name="SFX sortie BUUUT" from={50} layout="none">
				<Audio src={staticFile('sfx/whoosh-sortie.wav')} volume={0.39} />
			</Sequence>
			<Sequence name="SFX numéro" from={57} layout="none">
				<Audio src={staticFile('sfx/impact-numero.wav')} volume={0.56} />
			</Sequence>
			<Sequence name="SFX plongée" from={81} layout="none">
				<Audio src={staticFile('sfx/aspiration.wav')} volume={0.42} />
			</Sequence>
			<Sequence name="SFX joueur" from={93} layout="none">
				<Audio src={staticFile('sfx/atterrissage.wav')} volume={0.49} />
			</Sequence>
			<Sequence name="SFX nom" from={108} layout="none">
				<Audio src={staticFile('sfx/scintillement.wav')} volume={0.28} />
			</Sequence>
			<Sequence name="SFX plongée finale" from={248} layout="none">
				<Audio src={staticFile('sfx/aspiration.wav')} volume={0.42} />
			</Sequence>
			<Sequence name="SFX emblème" from={260} layout="none">
				<Audio src={staticFile('sfx/impact-final.wav')} volume={0.66} />
			</Sequence>
		</>
);
