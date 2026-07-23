import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { nip19 } from 'nostr-tools';

export interface KeyPair {
  skHex: string;
  npub: string;
  nsec: string;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateKeyPair(): KeyPair {
  const sk = generateSecretKey();
  const pubHex = getPublicKey(sk);
  const npub = nip19.npubEncode(pubHex);
  const nsec = nip19.nsecEncode(sk);
  return { skHex: bytesToHex(sk), npub, nsec };
}

export function keyPairFromSkHex(skHex: string): KeyPair {
  const sk = hexToBytes(skHex);
  const pubHex = getPublicKey(sk);
  const npub = nip19.npubEncode(pubHex);
  const nsec = nip19.nsecEncode(sk);
  return { skHex, npub, nsec };
}
