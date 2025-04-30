import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Match, Player, Set } from '@shared/schema';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PixelBorder } from '@/components/ui/pixel-border';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';

export default function GameHistoryScreen() {
  const [, navigate] = useLocation();

  // Fetch all matches
  const { data: matches = [], isLoading: isLoadingMatches } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
  });

  // Fetch all sets
  const { data: sets = [] } = useQuery<Set[]>({
    queryKey: ['/api/sets'],
  });

  // Fetch all players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  // Helper function to get player name by ID
  const getPlayerNameById = (playerId: number | undefined | null): string => {
    if (!playerId) return 'Unknown';
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  // Helper function to format timestamp
  const formatDate = (timestamp?: string | number | Date): string => {
    if (!timestamp) return 'N/A';
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy - h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to view match details
  const viewMatchDetails = (matchId: number) => {
    navigate(`/result/${matchId}`);
  };

  // Sort matches by createdAt in descending order (newest first)
  const sortedMatches = [...matches].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Game History</h1>
        </div>
        <div className="flex justify-center space-x-4">
          <Button
            className="font-arcade px-6 py-2 bg-[#FFD700] text-black hover:bg-opacity-80"
            onClick={() => navigate('/admin')}
          >
            BACK TO ADMIN
          </Button>
          <Button
            className="font-arcade px-6 py-2 bg-[#FF4D4D] text-black hover:bg-opacity-80"
            onClick={() => navigate('/')}
          >
            NEW GAME
          </Button>
          <Button
            className="font-arcade px-6 py-2 bg-[#4D4DFF] text-white hover:bg-opacity-80"
            onClick={() => navigate('/leaderboard')}
          >
            VIEW LEADERBOARD
          </Button>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">All Matches</h2>
        </CardHeader>
        <CardContent>
          {isLoadingMatches || isLoadingPlayers ? (
            <div className="text-center font-arcade py-8 text-gray-500">
              LOADING MATCH DATA...
            </div>
          ) : sortedMatches.length === 0 ? (
            <div className="text-center font-arcade py-8 text-gray-500">
              NO MATCH DATA AVAILABLE
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">West Team</TableHead>
                    <TableHead className="text-white">East Team</TableHead>
                    <TableHead className="text-white">Final Score</TableHead>
                    <TableHead className="text-white">Winner</TableHead>
                    <TableHead className="text-white">MVP</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMatches.map((match) => {
                    const westPlayer1 = getPlayerNameById(match.westPlayer1Id);
                    const westPlayer2 = getPlayerNameById(match.westPlayer2Id);
                    const eastPlayer1 = getPlayerNameById(match.eastPlayer1Id);
                    const eastPlayer2 = getPlayerNameById(match.eastPlayer2Id);
                    const mvpPlayer = getPlayerNameById(match.mvpPlayerId || undefined);
                    
                    return (
                      <TableRow key={match.id} className="hover:bg-gray-800">
                        <TableCell className="text-gray-300">
                          {formatDate(match.createdAt)}
                        </TableCell>
                        <TableCell className="text-[#FF4D4D]">
                          {westPlayer1} / {westPlayer2}
                        </TableCell>
                        <TableCell className="text-[#4D4DFF]">
                          {eastPlayer1} / {eastPlayer2}
                        </TableCell>
                        <TableCell className="font-digital">
                          {match.westScore || 0} - {match.eastScore || 0}
                        </TableCell>
                        <TableCell>
                          {match.isComplete ? (
                            <Badge variant={match.winningDivision === 'west' ? 'destructive' : 'default'}>
                              {match.winningDivision?.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge variant="outline">IN PROGRESS</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[#FFD700]">
                          {match.mvpPlayerId ? mvpPlayer : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => viewMatchDetails(match.id)}
                            className="text-white border-white hover:bg-gray-700"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}