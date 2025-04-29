import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Player, Match } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ChromeText } from '@/components/ui/chrome-text';
import { PixelBorder } from '@/components/ui/pixel-border';

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
          if (winningDivision === 'west') {
            stats[playerId].wins++;
          }
        }
      });

      [match.eastPlayer1Id, match.eastPlayer2Id].forEach(playerId => {
        if (playerId && stats[playerId]) {
          stats[playerId].matches++;
          if (winningDivision === 'east') {
            stats[playerId].wins++;
          }
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
        <div className="animate-pulse w-full h-4 bg-gray-700 rounded mb-2"></div>
        <div className="animate-pulse w-full h-4 bg-gray-700 rounded mb-2"></div>
        <div className="animate-pulse w-full h-4 bg-gray-700 rounded mb-2"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl px-4 py-8">
      <div className="mb-6 text-center">
        <h2 className="font-arcade text-2xl mb-2">
          <ChromeText>LEADERBOARD</ChromeText>
        </h2>
        <p className="font-digital text-sm text-gray-400">Player Rankings and Stats</p>
      </div>

      <div className="leaderboard bg-gradient-to-b from-gray-900 to-black border-2 border-[#FFD700] p-4 mb-8">
        <div className="grid grid-cols-1 gap-4">
          {playerStats.length > 0 ? (
            playerStats.map((stat, index) => (
              <div 
                key={stat.player.id}
                className="player-stat flex items-center bg-black p-3 border border-gray-800"
              >
                <div className="rank font-digital text-xl mr-4 text-[#FFD700] w-8 text-center">
                  {index + 1}
                </div>
                <div className="player-image mr-4">
                  <PixelBorder>
                    <img src={stat.player.avatarUrl} alt={stat.player.name} className="w-12 h-12 object-cover" />
                  </PixelBorder>
                </div>
                <div className="player-info flex-grow">
                  <div className="font-arcade text-sm mb-1">
                    {stat.player.name}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-digital">
                    <div>
                      <span className="text-[#FFD700]">{(stat.winRate / 100).toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="ml-1">{stat.wins}-{stat.matches - stat.wins}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">MVP:</span> 
                      <span className="text-[#FFD700] ml-1">{stat.mvps}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center font-arcade text-sm py-8 text-gray-500">
              NO MATCH DATA AVAILABLE
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons flex justify-center space-x-4">
        <Button
          className="font-arcade px-6 py-2 bg-[#FF4D4D] text-black hover:bg-opacity-80"
          onClick={() => navigate('/')}
        >
          BACK TO SELECTION
        </Button>
      </div>
    </div>
  );
};

export default LeaderboardScreen;