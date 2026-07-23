export function crossfade(left: number, right: number, position: number, fadeLength: number): number {
  const numerator = left * (fadeLength - position) + right * position;
  let result = Math.round(numerator / fadeLength);
  if (result > 32767) result = 32767;
  if (result < -32768) result = -32768;
  return result;
}

export async function sha256Bytes(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function sha256Int16(data: Int16Array): Promise<string> {
  return sha256Bytes(new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength));
}
