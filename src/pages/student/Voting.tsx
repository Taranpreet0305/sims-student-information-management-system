import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function StudentVoting() {
  const [elections, setElections] = useState<any[]>([]);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadElections();
    loadVotedElections();
  }, []);

  const loadElections = async () => {
    const { data } = await supabase
      .from("elections")
      .select(`
        *,
        candidates (*)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data) {
      setElections(data);
    }
  };

  const loadVotedElections = async () => {
    const enrollmentNumber = localStorage.getItem("enrollment_number");
    const { data } = await supabase
      .from("votes")
      .select("election_id")
      .eq("voter_enrollment", enrollmentNumber);

    if (data) {
      setVotedElections(new Set(data.map(v => v.election_id)));
    }
  };

  const handleVote = async (electionId: string, candidateId: string) => {
    setLoading(true);
    const enrollmentNumber = localStorage.getItem("enrollment_number");

    const { error } = await supabase.from("votes").insert({
      election_id: electionId,
      candidate_id: candidateId,
      voter_enrollment: enrollmentNumber,
    });

    if (error) {
      toast.error("Failed to cast vote");
    } else {
      toast.success("Vote cast successfully!");
      await loadVotedElections();
      await loadElections();
    }

    setLoading(false);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Elections & Voting</h1>
          <p className="text-muted-foreground">Participate in active elections</p>
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No active elections at the moment</p>
            </CardContent>
          </Card>
        ) : (
          elections.map((election) => {
            const hasVoted = votedElections.has(election.id);
            const candidates = election.candidates || [];

            return (
              <Card key={election.id}>
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Vote className="h-5 w-5" />
                        {election.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{election.description}</CardDescription>
                    </div>
                    {hasVoted && (
                      <div className="flex items-center gap-2 text-accent">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Voted</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {candidates.map((candidate: any) => (
                      <Card key={candidate.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg">{candidate.name}</CardTitle>
                          <CardDescription>
                            {candidate.position} <br />
                            {candidate.course_name} - Year {candidate.year}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {candidate.manifesto && (
                            <p className="text-sm text-muted-foreground mb-4">{candidate.manifesto}</p>
                          )}
                          <Button
                            onClick={() => handleVote(election.id, candidate.id)}
                            disabled={hasVoted || loading}
                            className="w-full"
                          >
                            {hasVoted ? "Already Voted" : "Vote"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </StudentLayout>
  );
}
