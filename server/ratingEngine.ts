
interface RatingSettings {
  dailyBonusAmount: number;
  kFactor: number;
  initialRating: number;
  victoryMarginWeight: string;
}

interface PlayerRating {
  rating: number;
  ratingDeviation: number;
  volatility: number | string;
}

class RatingEngine {
  private readonly TAU = 0.5;
  private readonly EPSILON = 0.000001;

  private settings: RatingSettings = {
    dailyBonusAmount: 15,
    kFactor: 200,
    initialRating: 1500,
    victoryMarginWeight: 'high'
  };

  getSettings(): RatingSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: RatingSettings) {
    this.settings = { ...newSettings };
  }

  private getVictoryMarginMultiplier(pointDiff: number): number {
    const baseMultiplier = Math.log(Math.abs(pointDiff) + 1) / Math.log(10);
    const weightMultiplier = this.settings.victoryMarginWeight === 'low' ? 0.5 :
                            this.settings.victoryMarginWeight === 'high' ? 2.0 : 1.0;
    return baseMultiplier * weightMultiplier;
  }

  private g(ratingDeviation: number): number {
    return 1 / Math.sqrt(1 + (3 * Math.pow(ratingDeviation, 2)) / (Math.pow(Math.PI, 2)));
  }

  private E(rating: number, opponentRating: number, opponentRD: number): number {
    return 1 / (1 + Math.exp(-this.g(opponentRD) * (rating - opponentRating) / 400));
  }

  calculateNewRating(
    player: PlayerRating,
    opponents: PlayerRating[],
    scores: number[], // 1 for win, 0.5 for draw, 0 for loss
    pointDiffs: number[] // Point difference in each match
  ): PlayerRating {
    console.log('Calculating new rating:', {
      currentRating: player.rating,
      opponents: opponents.map(o => o.rating),
      scores,
      pointDiffs
    });
    const μ = player.rating;
    const φ = player.ratingDeviation;
    // Convert volatility to number if it's a string
    const σ = typeof player.volatility === 'string' ? parseFloat(player.volatility) : player.volatility;
    
    const v = this.calculateV(μ, φ, opponents);
    const Δ = this.calculateDelta(v, μ, φ, opponents, scores, pointDiffs);
    const σ_new = this.calculateNewVolatility(σ, Δ, v, φ);
    const φ_star = Math.sqrt(Math.pow(φ, 2) + Math.pow(σ_new, 2));
    const φ_new = 1 / Math.sqrt(1 / Math.pow(φ_star, 2) + 1 / v);
    // Apply K-Factor directly to the score difference
    const kFactorMultiplier = this.settings.kFactor / 32; // Normalize relative to default K=32
    const baseRatingChange = Math.pow(φ_new, 2) * this.g(φ) * 
      opponents.reduce((sum, opp, i) => {
        const marginMultiplier = this.getVictoryMarginMultiplier(pointDiffs[i]);
        const scoreDiff = (scores[i] - this.E(μ, opp.rating, opp.ratingDeviation));
        return sum + this.g(opp.ratingDeviation) * scoreDiff * marginMultiplier * kFactorMultiplier;
      }, 0);

    const μ_new = μ + baseRatingChange;

    return {
      rating: μ_new,
      ratingDeviation: φ_new,
      volatility: σ_new.toString() // Convert to string for storage
    };
  }

  private calculateV(μ: number, φ: number, opponents: PlayerRating[]): number {
    return 1 / opponents.reduce((sum, opp) => {
      const E = this.E(μ, opp.rating, opp.ratingDeviation);
      const g = this.g(opp.ratingDeviation);
      return sum + Math.pow(g, 2) * E * (1 - E);
    }, 0);
  }

  private calculateDelta(
    v: number, 
    μ: number, 
    φ: number, 
    opponents: PlayerRating[], 
    scores: number[],
    pointDiffs: number[]
  ): number {
    return v * opponents.reduce((sum, opp, i) => {
      const marginMultiplier = this.getVictoryMarginMultiplier(pointDiffs[i]);
      return sum + this.g(opp.ratingDeviation) * 
        (scores[i] - this.E(μ, opp.rating, opp.ratingDeviation)) * marginMultiplier;
    }, 0);
  }

  private calculateNewVolatility(σ: number, Δ: number, v: number, φ: number): number {
    const a = Math.log(Math.pow(σ, 2));
    const f = (x: number): number => {
      const eX = Math.exp(x);
      const num = eX * (Math.pow(Δ, 2) - Math.pow(φ, 2) - v - eX);
      const den = 2 * Math.pow(Math.pow(φ, 2) + v + eX, 2);
      return num / den - (x - a) / Math.pow(this.TAU, 2);
    }

    // Illinois algorithm
    let A = a;
    let B = Math.log(Math.pow(Δ, 2) - Math.pow(φ, 2) - v);
    if (B < A) {
      B = A + this.TAU;
    }

    let fA = f(A);
    let fB = f(B);
    
    while (Math.abs(B - A) > this.EPSILON) {
      const C = A + (A - B) * fA / (fB - fA);
      const fC = f(C);
      
      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }
      
      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  getInitialRating(): PlayerRating {
    return {
      rating: this.settings.initialRating,
      ratingDeviation: 350,
      volatility: 0.06
    };
  }
}

export const ratingEngine = new RatingEngine();
