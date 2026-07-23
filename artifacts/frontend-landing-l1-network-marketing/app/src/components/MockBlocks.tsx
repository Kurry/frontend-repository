import React from 'react';
import { ArrowRight } from 'phosphor-react';

const networkRows = [
  { block: '14589201', age: '2 secs ago', transactions: 34, validator: '0x9f4a2c11...' },
  { block: '14589202', age: '4 secs ago', transactions: 27, validator: '0x72bd80e6...' },
  { block: '14589203', age: '6 secs ago', transactions: 51, validator: '0xa5c391d4...' },
  { block: '14589204', age: '8 secs ago', transactions: 19, validator: '0x3e84b207...' },
  { block: '14589205', age: '10 secs ago', transactions: 43, validator: '0xc18f65aa...' },
];

export function TrustStrip() {
  return (
    <section className="trust-strip py-12 bg-surface/30 border-y border-white/5 relative z-20" aria-label="Trusted Partners">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-8">Trusted by</p>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
          <div className="text-xl display-font font-bold">Acme Corp</div>
          <div className="text-xl display-font font-bold">Globex</div>
          <div className="text-xl display-font font-bold">Soylent</div>
          <div className="text-xl display-font font-bold">Initech</div>
          <div className="text-xl display-font font-bold">Umbrella</div>
        </div>
      </div>
    </section>
  );
}

export function DeveloperResources() {
  return (
    <section className="developer-resources chapter py-24 bg-void relative z-20" aria-label="Developer Resources">
      <div className="container mx-auto px-4">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">DEVELOPER RESOURCES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="notch-br bg-surface/50 p-8 border border-white/10 group hover:border-white/20 transition-colors">
            <h3 className="text-2xl display-font font-bold mb-4">Documentation</h3>
            <p className="text-gray-400 mb-8">Comprehensive guides, API references, and architecture overviews.</p>
            <button type="button" className="btn btn-primary notch-br gap-2 group-hover:brightness-110">
              Read docs <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="notch-br bg-surface/50 p-8 border border-white/10 group hover:border-white/20 transition-colors">
            <h3 className="text-2xl display-font font-bold mb-4">GitHub</h3>
            <p className="text-gray-400 mb-8">Explore our open-source repositories and contribute to Ridge.</p>
            <button type="button" className="btn btn-outline notch-br gap-2 group-hover:bg-white/5">
              View code <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NetworkInAction() {
  return (
    <section className="network-in-action surface-copy chapter py-24 bg-surface relative z-20" id="network-in-action" aria-labelledby="network-in-action-title">
      <div className="container mx-auto px-4">
        <h2 id="network-in-action-title" className="chapter-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">Network in action</h2>
        <div className="void-copy notch-br bg-void border border-current/10 p-6 overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr className="opacity-70 border-b border-current/10">
                <th className="pb-4 text-left font-normal">Block</th>
                <th className="pb-4 text-left font-normal">Age</th>
                <th className="pb-4 text-left font-normal">Txn</th>
                <th className="pb-4 text-left font-normal">Validator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {networkRows.map((row) => (
                <tr key={row.block} className="hover:bg-surface/50 transition-colors">
                  <td className="py-4 text-accent">{row.block}</td>
                  <td className="py-4 opacity-70">{row.age}</td>
                  <td className="py-4">{row.transactions}</td>
                  <td className="py-4 opacity-70 truncate max-w-[120px]">{row.validator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function NewsStories() {
  return (
    <section className="news-stories chapter py-24 bg-void relative z-20" aria-label="News & stories">
      <div className="container mx-auto px-4">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">NEWS & STORIES</h2>
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[300px] w-full md:w-1/3 notch-br bg-surface/30 border border-white/10 p-6 snap-start shrink-0 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-accent mb-4">Press Release</p>
                <h3 className="text-xl display-font font-bold mb-4 line-clamp-2">Ridge Network Achieves New Milestone in Cross-Chain Interoperability</h3>
              </div>
              <button type="button" className="text-sm font-bold flex items-center gap-2 mt-8 hover:text-accent transition-colors">
                Read article <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SolutionsGrid() {
  return (
    <section className="solutions-grid chapter py-24 bg-surface relative z-20" aria-label="Solutions">
      <div className="container mx-auto px-4">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-16 tracking-tight">SOLUTIONS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['DeFi', 'Gaming', 'Enterprise', 'Institutions'].map((sol) => (
            <div key={sol} className="notch-br bg-void border border-white/10 p-6 aspect-square flex flex-col justify-between group hover:border-accent/50 transition-colors">
              <h3 className="text-2xl display-font font-bold">{sol}</h3>
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CommunityBlock() {
  return (
    <section className="community-block chapter py-24 bg-ink text-white relative z-20" aria-label="Community">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="chapter-title text-4xl md:text-5xl font-bold mb-8 tracking-tight">JOIN THE COMMUNITY</h2>
        <p className="text-lg opacity-80 mb-12">Connect with thousands of builders, validators, and creators shaping the future of Ridge.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button type="button" className="btn bg-white text-ink hover:bg-gray-200 notch-br border-none">
            Discord Server
          </button>
          <button type="button" className="btn btn-outline text-white hover:bg-white/10 notch-br">
            Follow on X
          </button>
        </div>
      </div>
    </section>
  );
}
