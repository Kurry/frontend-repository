import { useRef, useEffect, useState } from 'preact/hooks';
import { mode, outputBuffer, commandHistory, theme } from './store.js';
import { processCommand } from './commands.js';
import gsap from 'gsap';

export default function Terminal({ onClose }) {
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const outputContainerRef = useRef(null);
  const hasBooted = useRef(false);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!hasBooted.current && outputBuffer.value.length === 0) {
      hasBooted.current = true;
      const bootSequence = [
        { text: 'Initializing system environment...' },
        { text: 'Loading kernel modules... [OK]' },
        { text: 'Mounting virtual file systems... [OK]' },
        { text: 'Starting network interface... [OK]' },
        { text: 'Establishing secure connection... [OK]' },
        { text: 'Welcome to TerminalPortfolio v1.0.0', type: 'accent mt-2 font-bold' },
        { text: 'Type /help to see available commands.', type: 'dim mb-4' },
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < bootSequence.length) {
          outputBuffer.value = [...outputBuffer.value, bootSequence[index]];
          index++;
        } else {
          clearInterval(interval);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        commandHistory.value = [...commandHistory.value, val];
        processCommand(val);
        e.target.value = '';
        setHistoryIndex(-1);

        setTimeout(() => {
          if (outputContainerRef.current) {
            const newLines = outputContainerRef.current.querySelectorAll('.output-line:not(.animated)');
            gsap.fromTo(newLines,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, onComplete: () => {
                newLines.forEach(l => l.classList.add('animated'));
              }}
            );
          }
        }, 50);
      }
    } else if (e.key === 'ArrowUp') {
       e.preventDefault();
       if (commandHistory.value.length > 0) {
           const newIndex = historyIndex === -1 ? commandHistory.value.length - 1 : Math.max(0, historyIndex - 1);
           setHistoryIndex(newIndex);
           e.target.value = commandHistory.value[newIndex];
       }
    } else if (e.key === 'ArrowDown') {
       e.preventDefault();
       if (historyIndex !== -1) {
           const newIndex = historyIndex + 1;
           if (newIndex >= commandHistory.value.length) {
               setHistoryIndex(-1);
               e.target.value = '';
           } else {
               setHistoryIndex(newIndex);
               e.target.value = commandHistory.value[newIndex];
           }
       }
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputBuffer.value]);

  const toggleMode = () => {
    mode.value = mode.value === 'cli' ? 'board' : 'cli';
  };

  return (
    <div className="terminal-window h-full flex flex-col p-2 sm:p-4 text-text-main font-mono text-xs sm:text-sm relative overflow-hidden" onClick={() => inputRef.current?.focus()}>
      <div className="flex justify-between items-center mb-2 sm:mb-4 pb-2 border-b border-border">
        <div className="flex gap-2">
          <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80 transition-opacity" aria-label="Close terminal" />
          <button className="w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 transition-opacity" aria-label="Minimize terminal" />
          <button className="w-3 h-3 rounded-full bg-green-500 hover:opacity-80 transition-opacity" aria-label="Maximize terminal" />
        </div>

        <button onClick={toggleMode} className="text-[10px] sm:text-xs bg-base-200 px-2 py-1 rounded border border-border hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none" aria-label="Toggle mode">
          {mode.value === 'cli' ? 'Switch to Board' : 'Switch to CLI'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 pb-20" ref={outputContainerRef}>
        {outputBuffer.value.map((line, i) => (
          <div key={i} className={`output-line ${line.type || ''}`} dangerouslySetInnerHTML={{ __html: line.html || line.text }} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-terminal-bg pt-2 border-t border-border/30">
        {commandHistory.value.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-1 scrollbar-hide">
            {commandHistory.value.slice(-5).reverse().map((cmd, idx) => (
              <button key={idx} className="badge badge-sm badge-outline whitespace-nowrap opacity-50 hover:opacity-100 transition-opacity" onClick={() => { if(inputRef.current) inputRef.current.value = cmd; inputRef.current.focus(); }}>
                {cmd}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none border-none text-text-main h-10 px-2 focus:ring-2 focus:ring-primary rounded"
            onKeyDown={handleKeyDown}
            aria-label="Command prompt"
            placeholder='Type a command... try "/help"'
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
