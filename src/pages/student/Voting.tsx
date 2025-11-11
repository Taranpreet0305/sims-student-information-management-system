import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Vote, CheckCircle, Trophy, Medal } from "lucide-react";
import { toast } from "sonner";

export default function StudentVoting() {
  const [elections, setElections] = useState<any[]>([]);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [enrollment, setEnrollment] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (enrollment) {
      loadElections();
      loadVotedElections();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('elections-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'elections'
        }, () => {
          loadElections();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [enrollment]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("enrollment_number")
        .eq("id", user.id)
        .single();
      if (data) {
        setEnrollment(data.enrollment_number);
      }
    }
  };

  const loadElections = async () => {
    const { data } = await supabase
      .from("elections")
      .select(`
        *,
        candidates (*)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setElections(data);
    }
  };

  const loadVotedElections = async () => {
    const { data } = await supabase
      .from("votes")
      .select("election_id")
      .eq("voter_enrollment", enrollment);

    if (data) {
      setVotedElections(new Set(data.map(v => v.election_id)));
    }
  };

  const handleVote = async (electionId: string, candidateId: string) => {
    setLoading(true);

    const { error } = await supabase.from("votes").insert({
      election_id: electionId,
      candidate_id: candidateId,
      voter_enrollment: enrollment,
    });

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast.error("You have already voted in this election");
      } else {
        toast.error("Failed to cast vote: " + error.message);
      }
    } else {
      toast.success("Vote cast successfully!");
      await loadVotedElections();
      await loadElections();
    }

    setLoading(false);
  };

  const getWinner = (candidates: any[]) => {
    if (!candidates || candidates.length === 0) return null;
    return candidates.reduce((prev, current) => 
      (current.vote_count > prev.vote_count) ? current : prev
    );
  };

  const getTotalVotes = (candidates: any[]) => {
    return candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
  };

  return (
    <StudentLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Elections & Voting</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Participate in active elections and view results</p>
        </div>

        {elections.length === 0 ? (
          <Card className="bg-card/70 backdrop-blur-md">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground text-sm sm:text-base">No elections at the moment</p>
            </CardContent>
          </Card>
        ) : (
          elections.map((election) => {
            const hasVoted = votedElections.has(election.id);
            const candidates = election.candidates || [];
            const isResultPublished = election.result_published;
            const winner = isResultPublished ? getWinner(candidates) : null;
            const totalVotes = isResultPublished ? getTotalVotes(candidates) : 0;
            const isActive = election.status === 'active';

            return (
              <Card key={election.id} className="bg-card/70 backdrop-blur-md border-2">
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl mb-2">
                        <Vote className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">{election.title}</span>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">{election.description}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                        {isActive ? "Active" : "Closed"}
                      </Badge>
                      {hasVoted && (
                        <Badge variant="outline" className="text-accent text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Voted
                        </Badge>
                      )}
                      {isResultPublished && (
                        <Badge variant="outline" className="text-primary text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Results
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Show Results if Published */}
                  {isResultPublished ? (
                    <div className="space-y-4">
                      <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-primary" />
                        <h3 className="text-base sm:text-lg font-bold mb-1">Election Results</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Votes: {totalVotes}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {candidates
                          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                          .map((candidate, index) => {
                            const percentage = totalVotes > 0 ? ((candidate.vote_count || 0) / totalVotes * 100).toFixed(1) : 0;
                            const isWinner = winner?.id === candidate.id;
                            
                            return (
                              <Card key={candidate.id} className={`border-2 ${isWinner ? 'border-primary bg-primary/5' : ''}`}>
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      {index === 0 && <Medal className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm sm:text-base truncate">{candidate.name}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                          {candidate.position} • {candidate.course_name} Year {candidate.year}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={isWinner ? "default" : "secondary"} className="text-xs sm:text-sm flex-shrink-0">
                                      {candidate.vote_count || 0} votes
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <Progress value={parseFloat(percentage as string)} className="h-2" />
                                    <p className="text-xs sm:text-sm text-right text-muted-foreground">{percentage}%</p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    /* Show Voting Interface if Active */
                    isActive ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {candidates.map((candidate: any) => (
                          <Card key={candidate.id} className="border-2 bg-card/50">
                            <CardHeader className="p-3 sm:p-4">
                              <CardTitle className="text-base sm:text-lg truncate">{candidate.name}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm">
                                {candidate.position} <br />
                                {candidate.course_name} - Year {candidate.year}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0">
                              {candidate.manifesto && (
                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-3">{candidate.manifesto}</p>
                              )}
                              <Button
                                onClick={() => handleVote(election.id, candidate.id)}
                                disabled={hasVoted || loading}
                                className="w-full text-xs sm:text-sm"
                                size="sm"
                              >
                                {hasVoted ? "Already Voted" : "Vote"}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground">
                        <p className="text-sm sm:text-base">This election has ended. Results will be published soon.</p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </StudentLayout>
  );
}
