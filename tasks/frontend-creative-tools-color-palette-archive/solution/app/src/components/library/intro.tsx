import { component$ } from '@builder.io/qwik';

export const Intro = component$(() => {
  return (
    <section class="intro max-w-5xl mx-auto px-4 pt-32 pb-16" data-scroll-reveal>
      <div class="intro__lead mb-12" data-reveal>
        <p class="intro__eyebrow text-sm uppercase tracking-widest mb-4">The o+a palette library</p>
        <h1 class="intro__headline text-3xl md:text-5xl leading-tight font-serif">
          The palette library brings together the color palettes of every work in our collection. You can browse by painting, move through individual swatches, or filter by color to see how certain colors are used across centuries of image-making.
        </h1>
      </div>
      <div class="intro__columns grid md:grid-cols-2 gap-8 text-lg leading-relaxed" data-reveal-group>
        <p>
          Each color is paired with the closest historical name we can find, drawn from pigment catalogues, dye records, and naturalist guides—sources like Werner’s <em>Nomenclature of Colours</em> (1821), the Winsor &amp; Newton pigment archive, and earlier texts like Cennini’s <em>Il Libro dell’Arte</em>. These names are matched computationally to the nearest documented colour, then listed alongside the painting they come from.
        </p>
        <p>
          This resource is less a fixed system than a way of seeing. Colors that feel contemporary often have long histories, and combinations that seem intuitive tend to repeat. The library is open source and ongoing—we add to it as the collection grows, and the full dataset is freely available.
        </p>
      </div>
    </section>
  );
});
