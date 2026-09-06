import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { profile } from './src/data/profile';
import { projects } from './src/data/projects';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The desktop is client-rendered, so a crawler that does not execute JavaScript
 * would see an empty page. This injects the same content as real, static,
 * visually hidden markup into index.html at build time — so the bio, experience
 * and projects are in the HTML payload itself rather than only after hydration.
 */
function seoPrerender(): Plugin {
  return {
    name: 'seo-prerender',
    transformIndexHtml(html: string) {
      const experience = profile.experience
        .map(
          (e) =>
            `<li><h3>${escape(e.role)} — ${escape(e.org)}</h3><p>${escape(e.period)}</p><p>${escape(e.summary)}</p></li>`,
        )
        .join('');

      const projectList = projects
        .map(
          (p) =>
            `<li><h3>${escape(p.name)}</h3><p>${escape(p.blurb)}</p><p>${escape(p.stack.join(', '))}</p>${p.links
              .map((l) => `<a href="${escape(l.href)}">${escape(l.label)}</a>`)
              .join('')}</li>`,
        )
        .join('');

      const skills = profile.skills
        .map((g) => `<li>${escape(g.label)}: ${escape(g.items.join(', '))}</li>`)
        .join('');

      const seo = [
        `<main class="sr-only-seo">`,
        `<h1>${escape(profile.name)} — ${escape(profile.headline)}</h1>`,
        `<p>${escape(profile.tagline)}</p>`,
        profile.bio.map((b) => `<p>${escape(b)}</p>`).join(''),
        `<h2>Experience</h2><ul>${experience}</ul>`,
        `<h2>Projects</h2><ul>${projectList}</ul>`,
        `<h2>Skills</h2><ul>${skills}</ul>`,
        `<h2>Contact</h2><ul>`,
        `<li><a href="${escape(profile.links.github)}">GitHub</a></li>`,
        `<li><a href="${escape(profile.links.linkedin)}">LinkedIn</a></li>`,
        `<li><a href="mailto:${escape(profile.links.email)}">Email</a></li>`,
        `</ul></main>`,
      ].join('');

      // Append just before </body> so it never displaces the app markup.
      return html.replace('</body>', `${seo}</body>`);
    },
  };
}

export default defineConfig({
  // The site lives at shieber.net/yoni/portfolio/, so every emitted asset URL
  // must carry that prefix. Keep the trailing slash.
  base: '/yoni/portfolio/',
  plugins: [react(), tailwindcss(), seoPrerender()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
