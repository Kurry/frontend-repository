import React from 'react';
import { NetworkInAction } from './MockBlocks';

const resources = [
  ['Developer documentation', 'Architecture guides, APIs, and deployment patterns for network builders.'],
  ['Validator toolkit', 'Operational checklists and observability resources for production validators.'],
  ['Ridge Academy', 'Hands-on learning paths for teams moving from prototype to launch.'],
];

export default function LandingChapters() {
  return (
    <div className="bg-void text-current relative z-20">
      <section className="chapter py-14 border-y border-current/10" aria-labelledby="trusted-title">
        <div className="container mx-auto px-4">
          <h2 id="trusted-title" className="text-sm font-bold uppercase tracking-[.22em] text-center mb-8">Trusted by teams building durable networks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Placeholder partner network">
            {['Northstar Labs', 'Helix Systems', 'Atlas Protocol', 'Summit Cloud'].map((name) => (
              <div key={name} className="notch-br border border-current/15 bg-surface/60 px-5 py-6 text-center font-semibold">{name}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="chapter py-24" aria-labelledby="resources-title">
        <div className="container mx-auto px-4">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-accent mb-3">Build with Ridge</p>
          <h2 id="resources-title" className="chapter-title text-4xl md:text-5xl font-bold mb-12">Developer resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.map(([title, copy]) => (
              <article key={title} className="notch-br border border-current/15 bg-surface/60 p-7 transition-transform hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-3">{title}</h3><p className="opacity-75">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <NetworkInAction />

      <section className="chapter py-24" aria-labelledby="news-title">
        <div className="container mx-auto px-4">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-accent mb-3">Field notes</p>
          <h2 id="news-title" className="chapter-title text-4xl md:text-5xl font-bold mb-8">News &amp; stories</h2>
          <div className="flex gap-5 overflow-x-auto snap-x pb-3">
            <article className="min-w-[18rem] flex-1 snap-start notch-br bg-surface p-6 border border-current/15"><p className="text-sm opacity-65 mb-3">Ecosystem</p><h3 className="text-xl font-bold">Inside the next generation of enterprise validators</h3></article>
            <article className="min-w-[18rem] flex-1 snap-start notch-br bg-surface p-6 border border-current/15"><p className="text-sm opacity-65 mb-3">Launch story</p><h3 className="text-xl font-bold">From testnet to a resilient global launch</h3></article>
          </div>
        </div>
      </section>

      <section className="chapter py-24 bg-surface" aria-labelledby="solutions-title">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12">
          <div><p className="text-sm font-bold uppercase tracking-[.2em] text-accent mb-3">Network outcomes</p><h2 id="solutions-title" className="chapter-title text-4xl md:text-5xl font-bold mb-6">Solutions</h2><p className="text-lg opacity-75">Purpose-built infrastructure for regulated assets, institution-grade settlement, and globally distributed applications.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">{['Institutional finance', 'Enterprise data', 'Gaming networks', 'Public infrastructure'].map((item) => <div key={item} className="notch-br border border-current/15 bg-void p-6 font-semibold">{item}</div>)}</div>
        </div>
      </section>

      <section className="chapter py-24" aria-labelledby="community-title">
        <div className="container mx-auto px-4 max-w-3xl">
          <div><p className="text-sm font-bold uppercase tracking-[.2em] text-accent mb-3">Build together</p><h2 id="community-title" className="chapter-title text-4xl md:text-5xl font-bold mb-6">Community</h2><p className="text-lg opacity-75">Meet operators, founders, and developers sharing production lessons across the Ridge ecosystem.</p></div>
        </div>
      </section>
    </div>
  );
}
