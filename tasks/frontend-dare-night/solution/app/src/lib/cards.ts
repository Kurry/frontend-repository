export type Category = 'Icebreaker' | 'Truth' | 'Dare' | 'Wild';
export type Intensity = 'Mild' | 'Spicy' | 'Wild';

export interface Card {
  id: string;
  prompt: string;
  category: Category;
  intensity: Intensity;
  isCustom?: boolean;
}

export const BUILT_IN_CARDS: Card[] = [
  // Icebreaker - Mild
  { id: 'ib-m1', prompt: "What's your go-to karaoke song?", category: 'Icebreaker', intensity: 'Mild' },
  { id: 'ib-m2', prompt: "If you could have dinner with any celebrity, who would it be?", category: 'Icebreaker', intensity: 'Mild' },
  { id: 'ib-m3', prompt: "What's the best gift you've ever received?", category: 'Icebreaker', intensity: 'Mild' },
  { id: 'ib-m4', prompt: "What's your favorite childhood memory?", category: 'Icebreaker', intensity: 'Mild' },
  { id: 'ib-m5', prompt: "If you were a superhero, what would your power be?", category: 'Icebreaker', intensity: 'Mild' },
  { id: 'ib-m6', prompt: "What's the most interesting place you've ever visited?", category: 'Icebreaker', intensity: 'Mild' },
  
  // Icebreaker - Spicy
  { id: 'ib-s1', prompt: "What's the most embarrassing thing you've done in front of a crush?", category: 'Icebreaker', intensity: 'Spicy' },
  { id: 'ib-s2', prompt: "What's a secret talent nobody here knows about?", category: 'Icebreaker', intensity: 'Spicy' },
  { id: 'ib-s3', prompt: "What's the worst date you've ever been on?", category: 'Icebreaker', intensity: 'Spicy' },
  { id: 'ib-s4', prompt: "What's the biggest lie you've told your parents?", category: 'Icebreaker', intensity: 'Spicy' },
  
  // Icebreaker - Wild
  { id: 'ib-w1', prompt: "Confess your most controversial pizza topping opinion.", category: 'Icebreaker', intensity: 'Wild' },
  { id: 'ib-w2', prompt: "What's the most unhinged thing in your search history?", category: 'Icebreaker', intensity: 'Wild' },
  
  // Truth - Mild
  { id: 't-m1', prompt: "What's your guilty pleasure TV show?", category: 'Truth', intensity: 'Mild' },
  { id: 't-m2', prompt: "Who in this room would you trust with a secret?", category: 'Truth', intensity: 'Mild' },
  { id: 't-m3', prompt: "What's one thing you've never told this group?", category: 'Truth', intensity: 'Mild' },
  { id: 't-m4', prompt: "What's your most annoying habit?", category: 'Truth', intensity: 'Mild' },
  { id: 't-m5', prompt: "What's the last thing you lied about?", category: 'Truth', intensity: 'Mild' },
  
  // Truth - Spicy
  { id: 't-s1', prompt: "Who here would you most want to be stuck in an elevator with?", category: 'Truth', intensity: 'Spicy' },
  { id: 't-s2', prompt: "What's the most embarrassing thing on your phone right now?", category: 'Truth', intensity: 'Spicy' },
  { id: 't-s3', prompt: "What's a compliment you received that you'll never forget?", category: 'Truth', intensity: 'Spicy' },
  { id: 't-s4', prompt: "Read the last text message you sent.", category: 'Truth', intensity: 'Spicy' },
  { id: 't-s5', prompt: "What's something you'd do if nobody would judge you?", category: 'Truth', intensity: 'Spicy' },
  
  // Truth - Wild
  { id: 't-w1', prompt: "What's your most embarrassing purchase?", category: 'Truth', intensity: 'Wild' },
  { id: 't-w2', prompt: "Name one person here you'd swap lives with for a day and why.", category: 'Truth', intensity: 'Wild' },
  { id: 't-w3', prompt: "What's the pettiest thing you've ever done?", category: 'Truth', intensity: 'Wild' },
  
  // Dare - Mild
  { id: 'd-m1', prompt: "Do your best impression of someone in this room.", category: 'Dare', intensity: 'Mild' },
  { id: 'd-m2', prompt: "Sing the chorus of your favorite song right now.", category: 'Dare', intensity: 'Mild' },
  { id: 'd-m3', prompt: "Do 10 jumping jacks right now.", category: 'Dare', intensity: 'Mild' },
  { id: 'd-m4', prompt: "Speak in a funny accent for the next 2 minutes.", category: 'Dare', intensity: 'Mild' },
  { id: 'd-m5', prompt: "Do your best dance move.", category: 'Dare', intensity: 'Mild' },
  
  // Dare - Spicy
  { id: 'd-s1', prompt: "Let the group go through your last 10 photos.", category: 'Dare', intensity: 'Spicy' },
  { id: 'd-s2', prompt: "Call a random contact and sing Happy Birthday.", category: 'Dare', intensity: 'Spicy' },
  { id: 'd-s3', prompt: "Do a dramatic reading of your last sent text message.", category: 'Dare', intensity: 'Spicy' },
  { id: 'd-s4', prompt: "Post a selfie with the funniest face you can make.", category: 'Dare', intensity: 'Spicy' },
  { id: 'd-s5', prompt: "Let someone draw something on your arm with a pen.", category: 'Dare', intensity: 'Spicy' },
  
  // Dare - Wild
  { id: 'd-w1', prompt: "Do an interpretive dance to a song the group picks.", category: 'Dare', intensity: 'Wild' },
  { id: 'd-w2', prompt: "Speak only in questions for the next 3 rounds.", category: 'Dare', intensity: 'Wild' },
  { id: 'd-w3', prompt: "Let the group compose and send a text from your phone.", category: 'Dare', intensity: 'Wild' },
  
  // Wild - Mild
  { id: 'w-m1', prompt: "Give everyone in the room a nickname starting with the same letter as their name.", category: 'Wild', intensity: 'Mild' },
  { id: 'w-m2', prompt: "Pick someone else to answer a Truth question of your choice.", category: 'Wild', intensity: 'Mild' },
  { id: 'w-m3', prompt: "Everyone says one nice thing about you.", category: 'Wild', intensity: 'Mild' },
  
  // Wild - Spicy
  { id: 'w-s1', prompt: "Switch an item of clothing with the person to your left for 3 rounds.", category: 'Wild', intensity: 'Spicy' },
  { id: 'w-s2', prompt: "The group decides your dare — no backing out!", category: 'Wild', intensity: 'Spicy' },
  { id: 'w-s3', prompt: "You must use a silly voice until your next turn.", category: 'Wild', intensity: 'Spicy' },
  
  // Wild - Wild
  { id: 'w-w1', prompt: "Tell your most embarrassing story, then pick someone else to tell theirs.", category: 'Wild', intensity: 'Wild' },
  { id: 'w-w2', prompt: "Do an improv comedy routine about everyone in the room for 1 minute.", category: 'Wild', intensity: 'Wild' },
  { id: 'w-w3', prompt: "Pick two people — they have to give you a dare and a truth. You do both.", category: 'Wild', intensity: 'Wild' },
];

export function getCategoryTailwindColor(category: Category): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Icebreaker': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' };
    case 'Truth': return { bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500' };
    case 'Dare': return { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' };
    case 'Wild': return { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', border: 'border-fuchsia-500' };
  }
}

export function getIntensityTailwindColor(intensity: Intensity): { bg: string; text: string; border: string } {
  switch (intensity) {
    case 'Mild': return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' };
    case 'Spicy': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
    case 'Wild': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' };
  }
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
