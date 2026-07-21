<script lang="ts">
  import { weeklyData, showTip, hideTip, type Category } from '../state.svelte';

  const H = 132;
  const data = $derived(weeklyData());
  const max = $derived(Math.max(1, ...data.map((d) => d.total)));

  function tipFor(e: MouseEvent, label: string, cat: Category, val: number) {
    showTip(e.clientX, e.clientY, `${label} · ${cat} · ${val} min`);
  }
</script>

<div class="weekly" role="img" aria-label="Weekly overview stacked bar chart of Meaningful, Neutral, and Draining minutes per day">
  {#each data as day (day.key)}
    {@const barH = day.total > 0 ? Math.max(8, (day.total / max) * H) : 4}
    <div class="week-col">
      <div class="week-bar" style="height:{barH}px">
        {#if day.total > 0}
          {@const pairs: [Category, number][] = [
            ['Meaningful', day.m],
            ['Neutral', day.n],
            ['Draining', day.d]
          ]}
          {#each pairs as pair}
            {@const cat = pair[0]}
            {@const val = pair[1]}
            {#if val > 0}
              <button
                type="button"
                class="week-seg {cat}"
                style="height:{Math.max(3, (val / day.total) * barH)}px;border:none;padding:0;display:block;width:100%"
                aria-label="{day.label} {cat} {val} minutes"
                onmouseenter={(e) => tipFor(e, day.label, cat, val)}
                onmousemove={(e) => tipFor(e, day.label, cat, val)}
                onmouseleave={hideTip}
                onfocus={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  showTip(r.left + r.width / 2, r.top, `${day.label} · ${cat} · ${val} min`);
                }}
                onblur={hideTip}
              ></button>
            {/if}
          {/each}
        {/if}
      </div>
      <span class="week-label" class:today={day.label === 'Today'}>{day.label}</span>
    </div>
  {/each}
</div>
<div class="legend">
  <span><i class="Meaningful"></i>Meaningful</span>
  <span><i class="Neutral"></i>Neutral</span>
  <span><i class="Draining"></i>Draining</span>
</div>
