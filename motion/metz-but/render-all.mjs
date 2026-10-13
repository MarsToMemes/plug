// Rend une carte de but par joueur de players.json dans out/<id>.mp4.
// Usage : node render-all.mjs [id ...]   (sans argument : tous les joueurs)
import {execFileSync} from 'node:child_process';
import {readFileSync, mkdirSync} from 'node:fs';

const players = JSON.parse(readFileSync(new URL('./players.json', import.meta.url), 'utf8'));
const wanted = process.argv.slice(2);
const extra = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];

mkdirSync('out', {recursive: true});
for (const {id, ...props} of players) {
	if (wanted.length && !wanted.includes(id)) continue;
	console.log(`→ ${id}`);
	execFileSync(
		'npx',
		['remotion', 'render', 'src/index.ts', 'GoalCard', `out/${id}.mp4`, `--props=${JSON.stringify(props)}`, ...extra],
		{stdio: 'inherit'},
	);
}
