export function createCampaignExport(gameState: any) {
  return {
    schemaVersion: 'fandangofury.campaign.v1',
    fighter: {
      displayName: gameState.fighterDisplayName || 'Fandango',
      effectsIntensity: gameState.fighterEffectsIntensity ?? 100,
    },
    pesos: gameState.pesos,
    upgrades: {
      maxHealth: gameState.upgrades['maxHealth'] || 0,
      attackPower: gameState.upgrades['attackPower'] || 0,
      furyGain: gameState.upgrades['furyGain'] || 0,
    },
    masks: {
      owned: gameState.ownedMasks,
      equipped: gameState.equippedMask || null,
    },
    stages: {
      unlocked: gameState.unlockedStages,
      completed: gameState.completedStages,
    },
    checkpoint: gameState.checkpoint || null,
  };
}
