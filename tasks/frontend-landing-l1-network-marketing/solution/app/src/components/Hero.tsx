import React, { useState, useEffect } from 'react';
import { ArrowDown } from 'phosphor-react';

export default function Hero() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero relative min-h-screen flex flex-col overflow-clip" id="hero" aria-label="Hero">
      <div className="container mx-auto px-4 z-10 pt-20 grid grid-cols-1 md:grid-cols-2 gap-4 bento-row">

        <div className="bento-mission load-target notch-br bg-surface/80 p-8 backdrop-blur-sm border border-white/10 flex flex-col justify-between min-h-[300px]">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-accent">01 / Mission</p>
          <div>
            <h1 className="text-5xl md:text-7xl font-bold display-font mb-4 leading-none tracking-tight">Custom Blockchains</h1>
            <p className="text-lg text-gray-300 max-w-sm">Architecting resilient network layers for enterprise protocols. Placeholder mission block.</p>
          </div>
        </div>

        <div className="bento-clock load-target notch-br bg-surface/80 p-8 backdrop-blur-sm border border-white/10 flex flex-col justify-between items-end text-right min-h-[300px]">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-accent">02 / Clock</p>
          <div className="flex flex-col items-end">
            <p className="text-6xl font-bold display-font" id="clock" aria-live="polite">{time}</p>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium tracking-widest text-gray-400">
              SCROLL <ArrowDown size={16} aria-hidden="true" className="animate-bounce" />
            </div>
          </div>
        </div>

      </div>

      <div className="hero-plane absolute inset-0 load-target notch-br-lg overflow-hidden z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 to-void mix-blend-multiply"></div>
        {/* Placeholder for terrain / abstract graphic */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 50% 120%, var(--color-ink) 0%, transparent 60%)'
        }}></div>
      </div>
    </section>
  );
}
