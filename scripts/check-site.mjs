import { readFile } from 'node:fs/promises';
const pages = ['index.html','join.html','privacy.html'];
for (const page of pages) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  if (!html.includes('<!doctype html>') || !html.includes('</html>')) throw new Error(`${page} is incomplete`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]+)"/g)) {
    const path = match[1] === '/' ? 'index.html' : match[1].replace(/^\//,'');
    if (!path.includes('.') || path.startsWith('api/')) continue;
    await readFile(new URL(`../${path}`, import.meta.url));
  }
}
console.log('Static routes and local assets are valid.');
