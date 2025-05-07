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
    let σ: number;
    try {
      σ = typeof player.volatility === 'string' ? parseFloat(player.volatility) : player.volatility;
      if (isNaN(σ) || σ <= 0) {
        console.warn('Invalid volatility value, using default:', player.volatility);
        σ = 0.06;
      }
    } catch (err) {
      console.error('Error parsing volatility:', err);
      σ = 0.06; // Default volatility
    }
    
    console.log('Player detailed:', {
      rating: μ,
      ratingDeviation: φ,
      volatility: σ,
      volatilityType: typeof player.volatility,
      originalValue: player.volatility
    });
    
    try {
      const v = this.calculateV(μ, φ, opponents);
      const Δ = this.calculateDelta(v, μ, φ, opponents, scores, pointDiffs);
      
      let σ_new: number;
      try {
        σ_new = this.calculateNewVolatility(σ, Δ, v, φ);
      } catch (err) {
        console.error('Error calculating new volatility:', err);
        σ_new = 0.06;
      }
      
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
    } catch (err) {
      console.error('Error in rating calculation:', err);
      // Return original values with a small rating change
      return {
        rating: μ + (scores[0] === 1 ? 5 : -5),
        ratingDeviation: φ,
        volatility: typeof player.volatility === 'string' ? player.volatility : player.volatility.toString()
      };
    }
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
    console.log('Volatility calculation inputs:', { σ, Δ, v, φ });
    
    try {
      const a = Math.log(Math.pow(σ, 2));
      console.log('a value:', a);
      
      // Safety check for NaN or infinite values
      if (isNaN(a) || !isFinite(a)) {
        console.warn('Invalid a value, using default volatility');
        return 0.06;
      }
      
      const f = (x: number): number => {
        try {
          const eX = Math.exp(x);
          const num = eX * (Math.pow(Δ, 2) - Math.pow(φ, 2) - v - eX);
          const den = 2 * Math.pow(Math.pow(φ, 2) + v + eX, 2);
          const result = num / den - (x - a) / Math.pow(this.TAU, 2);
          return result;
        } catch (err) {
          console.error('Error in f function:', err);
          throw err;
        }
      };

      // Illinois algorithm
      let A = a;
      let B: number;
      
      try {
        const bVal = Math.pow(Δ, 2) - Math.pow(φ, 2) - v;
        if (bVal <= 0) {
          console.warn('Invalid B value calculation, using fallback');
          B = A + this.TAU;
        } else {
          B = Math.log(bVal);
        }
      } catch (err) {
        console.error('Error calculating B:', err);
        B = A + this.TAU;
      }
      
      if (B < A) {
        B = A + this.TAU;
      }

      let fA: number, fB: number;
      try {
        fA = f(A);
        fB = f(B);
      } catch (err) {
        console.error('Error calculating fA/fB:', err);
        return 0.06;
      }
      
      console.log('Illinois algo values:', { A, B, fA, fB });
      
      // Safety check for NaN or infinite values
      if (isNaN(fA) || !isFinite(fA) || isNaN(fB) || !isFinite(fB)) {
        console.warn('Invalid fA or fB values, using default volatility');
        return 0.06;
      }
      
      let iterations = 0;
      const MAX_ITERATIONS = 100;
      
      while (Math.abs(B - A) > this.EPSILON && iterations < MAX_ITERATIONS) {
        iterations++;
        
        try {
          if (fB - fA === 0) {
            console.warn('Division by zero in Illinois algorithm, breaking loop');
            break;
          }
          
          const C = A + (A - B) * fA / (fB - fA);
          let fC: number;
          
          try {
            fC = f(C);
          } catch (err) {
            console.error('Error calculating fC:', err);
            break;
          }
          
          if (fC * fB < 0) {
            A = B;
            fA = fB;
          } else {
            fA = fA / 2;
          }
          
          B = C;
          fB = fC;
        } catch (err) {
          console.error('Error in Illinois algorithm iteration:', err);
          break;
        }
      }
      
      console.log(`Illinois algorithm completed in ${iterations} iterations`);
      
      try {
        const result = Math.exp(A / 2);
        
        // Safety check for the result
        if (isNaN(result) || !isFinite(result) || result <= 0) {
          console.warn('Invalid volatility result, using default:', result);
          return 0.06;
        }
        
        return result;
      } catch (err) {
        console.error('Error calculating final volatility:', err);
        return 0.06;
      }
    } catch (error) {
      console.error('Error in calculateNewVolatility:', error);
      // Return a fallback value
      return 0.06;
    }
  }

  getInitialRating(): PlayerRating {
    return {
      rating: this.settings.initialRating,
      ratingDeviation: 350,
      volatility: "0.06"
    };
  }
}

export const ratingEngine = new RatingEngine();