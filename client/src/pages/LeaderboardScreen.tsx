import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Player, Match } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ChromeText } from '@/components/ui/chrome-text';
import { PixelBorder } from '@/components/ui/pixel-border';
import StatBar from '@/components/ui/stat-bar';

interface PlayerStats {
  player: Player;
  wins: number;
  matches: number;
  winRate: number;
  mvps: number;
}

const LeaderboardScreen: React.FC = () => {
  const [, navigate] = useLocation();

  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const { data: matches = [], isLoading: isLoadingMatches } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
  });

  const playerStats: PlayerStats[] = React.useMemo(() => {
    if (!players.length || !matches.length) return [];

    const stats: Record<number, PlayerStats> = {};

    players.forEach(player => {
      stats[player.id] = {
        player,
        wins: 0,
        matches: 0,
        winRate: 0,
        mvps: 0
      };
    });

    matches.filter(match => match.isComplete).forEach(match => {
      const winningDivision = match.winningDivision;
      if (!winningDivision) return;

      [match.westPlayer1Id, match.westPlayer2Id].forEach(playerId => {
        if (playerId && stats[playerId]) {
          stats[playerId].matches++;
          if (winningDivision === 'west') stats[playerId].wins++;
        }
      });

      [match.eastPlayer1Id, match.eastPlayer2Id].forEach(playerId => {
        if (playerId && stats[playerId]) {
          stats[playerId].matches++;
          if (winningDivision === 'east') stats[playerId].wins++;
        }
      });

      if (match.mvpPlayerId && stats[match.mvpPlayerId]) {
        stats[match.mvpPlayerId].mvps++;
      }
    });

    const statsArray = Object.values(stats).map(stat => ({
      ...stat,
      winRate: stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0
    }));

    return statsArray.sort((a, b) => b.winRate - a.winRate);
  }, [players, matches]);

  if (isLoadingPlayers || isLoadingMatches) {
    return (
      <div className="w-full max-w-6xl px-4 py-8 text-center">
        <div className="font-arcade text-lg mb-4">LOADING LEADERBOARD...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl px-4 py-8">
      <div className="mb-6 text-center">
        <h2 className="font-arcade text-4xl mb-2">
          <ChromeText>LEADERBOARD</ChromeText>
        </h2>
        <p className="font-digital text-sm text-gray-400">Player Rankings and Stats</p>
      </div>

      <div className="leaderboard space-y-4">
        {playerStats.map((stat, index) => (
          <div 
            key={stat.player.id}
            className="player-stat bg-black border-2 border-[#FFD700] p-4"
          >
            <div className="flex items-center gap-4">
              <div className="rank font-arcade text-[#FFD700] text-2xl">
                {index + 1}
              </div>
              <PixelBorder>
                <img src={stat.player.avatarUrl} alt={stat.player.name} className="w-16 h-16 object-cover" />
              </PixelBorder>
              <div className="flex-grow">
                <div className="font-arcade text-lg mb-1">
                  {stat.player.name} <span className="text-gray-500">({stat.player.division.toUpperCase()})</span>
                </div>
                <div className="font-digital text-sm space-x-4">
                  <span>Win Rate: {stat.winRate.toFixed(0)}%</span>
                  <span>W/L: {stat.wins}/{stat.matches - stat.wins}</span>
                  <span>MVP: {stat.mvps}</span>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-digital text-sm w-16">SPEED</span>
                    <StatBar value={stat.player.speed} maxValue={10} />
                    <span className="font-digital text-sm">{stat.player.speed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-digital text-sm w-16">POWER</span>
                    <StatBar value={stat.player.power} maxValue={10} />
                    <span className="font-digital text-sm">{stat.player.power}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          className="font-arcade px-6 py-2 bg-[#FF4D4D] text-white rounded hover:bg-opacity-80"
          onClick={() => navigate('/')}
        >
          BACK TO SELECTION
        </Button>
      </div>
    </div>
  );
};

export default LeaderboardScreen;