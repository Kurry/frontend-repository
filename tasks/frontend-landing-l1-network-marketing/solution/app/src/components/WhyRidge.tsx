import React from 'react';

const pillars = [
  { id: '1', num: '01', title: 'High Throughput', copy: 'Built for enterprise scale with sub-second finality.' },
  { id: '2', num: '02', title: 'EVM Compatible', copy: 'Deploy existing contracts seamlessly with zero rewrites.' },
  { id: '3', num: '03', title: 'Institutional Security', copy: 'Bank-grade compliance and configurable permissioning.', isInk: true },
  { id: '4', num: '04', title: 'Native Interop', copy: 'Trustless bridging across the Ridge sub-network topology.' },
];

export default function WhyRidge() {
  return (
    <section className="why chapter min-h-screen py-24 relative z-20 bg-void" id="why" aria-label="Why">
      <div className="container mx-auto px-4 chapter-shell">
        <h2 className="chapter-title sticky-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">WHY RIDGE</h2>
        <div className="why-pile space-y-8 md:space-y-0" id="whyPile">
          {pillars.map((pillar, i) => (
            <article
              key={pillar.id}
              className={`why-card notch-br p-8 md:p-12 border border-white/10 ${pillar.isInk ? 'bg-ink text-white ink' : 'bg-surface/80 backdrop-blur-md text-current'} why-card--${i+1}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="why-shell max-w-2xl">
                <div className="why-copy flex flex-col gap-4">
                  <span className="num text-xl font-bold opacity-50">{pillar.num}</span>
                  <h3 className="text-3xl display-font font-bold">{pillar.title}</h3>
                  <p className="text-lg opacity-80 leading-relaxed">{pillar.copy}</p>
                </div>
                <div className="why-media" aria-hidden="true"></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
