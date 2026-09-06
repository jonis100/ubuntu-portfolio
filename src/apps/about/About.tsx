import { profile, systemInfo } from '@/data/profile';
import { useOS } from '@/os/store';

/** GNOME Settings' "About this computer" panel, repurposed as the profile. */
export default function About() {
  const openApp = useOS((s) => s.openApp);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-bg px-6 py-8 text-ink">
      <div className="mx-auto max-w-xl">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-accent text-3xl font-medium text-white shadow-lg">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-dim">
              {profile.headline} · {profile.subhead}
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-dim">{profile.tagline}</p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {profile.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-edge bg-surface p-3 text-center"
            >
              <p className="text-xl font-semibold text-accent">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-faint">{stat.label}</p>
            </div>
          ))}
        </div>

        <Section title="About">
          {profile.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mb-3 text-sm leading-relaxed text-dim">
              {paragraph}
            </p>
          ))}
        </Section>

        <Section title="Experience">
          <ol className="space-y-5">
            {profile.experience.map((entry) => (
              <li key={`${entry.org}-${entry.period}`} className="border-l-2 border-edge pl-4">
                <p className="text-xs text-faint">{entry.period}</p>
                <h3 className="font-medium text-ink">{entry.role}</h3>
                <p className="text-sm text-accent">{entry.org}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{entry.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.stack.map((tech) => (
                    <span key={tech} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-dim">
                      {tech}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Skills">
          <div className="space-y-3">
            {profile.skills.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span key={item} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-dim">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Certifications">
          <ul className="space-y-1.5">
            {profile.certifications.map((cert) => (
              <li key={cert} className="flex gap-2 text-sm text-dim">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {cert}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="System">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {[
              ['OS', systemInfo.os],
              ['Desktop', systemInfo.de],
              ['Location', profile.location],
              ['Education', profile.education],
            ].map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-faint">{key}</dt>
                <dd className="text-dim">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Credits">
          <p className="text-xs leading-relaxed text-faint">
            App icons are the Yaru icon theme by Sam Hewitt and the Ubuntu
            community, used under{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              CC BY-SA 4.0
            </a>
            . Ubuntu and the Ubuntu logo are trademarks of Canonical Ltd. This
            site is a personal portfolio and is not affiliated with or endorsed
            by Canonical.
          </p>
        </Section>

        <div className="mt-8 flex flex-wrap justify-center gap-2 pb-4">
          <a
            href={`mailto:${profile.links.email}`}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c7431a]"
          >
            Email me
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-edge px-4 py-2 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            LinkedIn ↗
          </a>
          <button
            onClick={() => openApp('files')}
            className="rounded-md border border-edge px-4 py-2 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Browse projects
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 border-b border-edge pb-1.5 text-sm font-semibold uppercase tracking-wide text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}
