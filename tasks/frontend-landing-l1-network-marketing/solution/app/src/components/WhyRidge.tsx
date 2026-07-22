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
      <div className="container mx-auto px-6 md:px-10 py-10 md:py-14 chapter-shell why-module surface-copy bg-surface notch-br-lg">
        <h2 className="chapter-title sticky-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">WHY RIDGE</h2>
        <div className="why-pile space-y-8 md:space-y-0" id="whyPile">
          {pillars.map((pillar, i) => (
            <article
              key={pillar.id}
              className={`why-card notch-br p-8 md:p-12 border border-current/10 ${pillar.isInk ? 'bg-ink text-white ink' : 'surface-copy bg-white/70 backdrop-blur-md'} why-card--${i+1}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="why-shell md:grid md:grid-cols-[1.35fr_1fr] gap-8 items-stretch">
                <div className="why-copy flex flex-col gap-4">
                  <span className="num text-xl font-bold opacity-50">{pillar.num}</span>
                  <h3 className="text-3xl display-font font-bold">{pillar.title}</h3>
                  <p className="text-lg opacity-80 leading-relaxed">{pillar.copy}</p>
                </div>
                <div className="why-media min-h-32 md:min-h-44 mt-8 md:mt-0 notch-br" aria-hidden="true"></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
