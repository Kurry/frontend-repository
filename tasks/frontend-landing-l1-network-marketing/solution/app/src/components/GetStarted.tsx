import React from 'react';
import { ArrowRight } from 'phosphor-react';

const steps = [
  { id: '1', title: 'Read the Docs', copy: 'Dive into our technical documentation and quickstarts.', action: 'Read documentation', target: 'developer-resources' },
  { id: '2', title: 'Deploy a Contract', copy: 'Use our web IDE to deploy your first smart contract.', action: 'Explore network activity', target: 'network-in-action' },
  { id: '3', title: 'Join the Community', copy: 'Connect with other builders in our developer hub.', action: 'Join developer community', target: 'community' },
];

export default function GetStarted() {
  return (
    <section className="get-started chapter py-24 bg-void relative z-20" id="getStarted" aria-label="Get started">
      <div className="container mx-auto px-4">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">Get Started</h2>

        <div className="trio grid grid-cols-1 sm:grid-cols-3 gap-6" id="trio">
          {steps.map((step, i) => (
            <article
              key={step.id}
              className="trio-card surface-copy bg-surface p-8 notch-br border border-current/10 flex flex-col justify-between items-start group hover:brightness-[.97] transition-all"
              style={{ '--i': i } as React.CSSProperties}
            >
              <div>
                <h3 className="text-2xl display-font font-bold mb-4">{step.title}</h3>
                <p className="opacity-70 mb-8">{step.copy}</p>
              </div>
              <button type="button" className="cta notch-br btn btn-primary flex items-center gap-2 group-hover:brightness-110 transition-all" onClick={() => document.getElementById(step.target)?.scrollIntoView({ behavior: 'smooth' })}>
                {step.action} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
