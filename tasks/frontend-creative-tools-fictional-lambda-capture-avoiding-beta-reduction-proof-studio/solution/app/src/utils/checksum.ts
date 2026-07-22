export function generateChecksum(state: any): string {
    return btoa(JSON.stringify(state)); // simplified checksum
}
