interface RatingSettings {
  dailyBonusAmount: number;
  kFactor: number;
  initialRating: number;
  victoryMarginWeight: string;
}

export class RatingEngine {
  private readonly TAU = 0.5;
  private readonly EPSILON = 0.000001;

  private settings: RatingSettings = {
    dailyBonusAmount: 15,
    kFactor: 32,
    initialRating: 1500,
    victoryMarginWeight: 'normal'
  };

  getSettings(): RatingSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: RatingSettings) {
    this.settings = { ...newSettings };
  }

  private getVictoryMarginMultiplier(pointDiff: number): number {
    const baseMultiplier = Math.log(Math.abs(pointDiff) + 1) / Math.log(10);
    switch (this.settings.victoryMarginWeight) {
      case 'low': return baseMultiplier * 0.5;
      case 'high': return baseMultiplier * 1.5;
      default: return baseMultiplier;
    }
  }
}