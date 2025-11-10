import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Vote, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  end_date: string;
  candidates: Candidate[];
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  course_name: string;
  year: number;
  section: string;
  vote_count: number;
  photo_url: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ElectionResults() {
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    const { data } = await supabase
      .from("elections")
      .select("*, candidates(*)")
      .eq("status", "completed")
      .order("end_date", { ascending: false });

    if (data) {
      setElections(data);
    }
  };

  const getWinnersByPosition = (candidates: Candidate[]) => {
    const positions = [...new Set(candidates.map(c => c.position))];
    const winners: Record<string, Candidate> = {};

    positions.forEach(position => {
      const positionCandidates = candidates.filter(c => c.position === position);
      const winner = positionCandidates.reduce((prev, current) => 
        (current.vote_count > prev.vote_count) ? current : prev
      );
      winners[position] = winner;
    });

    return winners;
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Election Results</h1>
          <p className="text-muted-foreground">View completed election results and statistics</p>
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No completed elections yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {elections.map((election) => {
              const winners = getWinnersByPosition(election.candidates);
              const totalVotes = election.candidates.reduce((sum, c) => sum + c.vote_count, 0);
              const chartData = election.candidates.map(c => ({
                name: c.name,
                votes: c.vote_count,
                position: c.position
              }));

              return (
                <Card key={election.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Vote className="h-5 w-5" />
                          {election.title}
                        </CardTitle>
                        <CardDescription className="mt-2">{election.description}</CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                          Ended: {new Date(election.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Winners Section */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Winners
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(winners).map(([position, candidate]) => (
                          <Card key={position} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {candidate.photo_url && (
                                  <img 
                                    src={candidate.photo_url} 
                                    alt={candidate.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
                                  />
                                )}
                                <div className="flex-1">
                                  <Badge className="mb-2 bg-yellow-500 text-white">{position}</Badge>
                                  <h4 className="font-semibold text-lg">{candidate.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.course_name} Year {candidate.year}
                                  </p>
                                  <p className="text-sm font-medium mt-2 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    {candidate.vote_count} votes
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Votes</p>
                          <p className="text-2xl font-bold">{totalVotes}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Candidates</p>
                          <p className="text-2xl font-bold">{election.candidates.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Positions</p>
                          <p className="text-2xl font-bold">{Object.keys(winners).length}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Bar Chart */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Vote Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="votes" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Vote Share</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="votes"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* All Candidates Table */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">All Candidates</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Rank</th>
                              <th className="text-left p-2">Candidate</th>
                              <th className="text-left p-2">Position</th>
                              <th className="text-left p-2">Course</th>
                              <th className="text-right p-2">Votes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...election.candidates]
                              .sort((a, b) => b.vote_count - a.vote_count)
                              .map((candidate, index) => (
                                <tr key={candidate.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2">
                                    <Badge variant={index < 3 ? "default" : "outline"}>
                                      #{index + 1}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {candidate.photo_url && (
                                        <img 
                                          src={candidate.photo_url} 
                                          alt={candidate.name}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      )}
                                      <span className="font-medium">{candidate.name}</span>
                                    </div>
                                  </td>
                                  <td className="p-2">{candidate.position}</td>
                                  <td className="p-2 text-sm text-muted-foreground">
                                    {candidate.course_name} Y{candidate.year} {candidate.section}
                                  </td>
                                  <td className="p-2 text-right font-semibold">{candidate.vote_count}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
