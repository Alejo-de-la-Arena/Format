// Isolated visual fixtures. Never connects to or writes to Supabase.
import http from 'node:http';
import { spawn } from 'node:child_process';

const season = (slug, numero, forma, colores, fecha_inicio, fecha_fin) => ({
  slug, numero, nombre: slug[0].toUpperCase() + slug.slice(1), forma, colores,
  fecha_inicio, fecha_fin, concepto: '', intro_text: '', intro_motion: 'signal',
});
const rows = [
  season('origin', '001', 'square', ['#1E38F5', '#0E1A6B', '#5B72FF', '#B8C7FF', '#FFFFFF'], '2020-08-07', '2020-08-28'),
  season('ascent', '002', 'triangle', ['#7B3FE4', '#2E1065', '#A06BFF', '#D9C7FF', '#FFFFFF'], '2020-09-04', '2090-09-25'),
];
const mock = http.createServer((req, res) => {
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.url.startsWith('/rest/v1/seasons') ? rows : [
    { fecha: '2020-08-28', especial: false, seasons: { slug: 'origin' }, lineup_slots: [], fotos_galeria: [], season_lab_clips: [] },
  ]));
});
mock.listen(4311, '127.0.0.1', () => {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '4310'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, FORMAT_QA_DIST: '.next-polish-qa-ascent', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4311', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-fixture-only' },
  });
  const stop = () => { server.kill(); mock.close(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  server.on('exit', () => mock.close());
});
