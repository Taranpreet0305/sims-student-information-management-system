import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Award } from "lucide-react";

export default function StudentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [enrollment, setEnrollment] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (enrollment) {
      loadMarks();
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

  const loadMarks = async () => {
    const { data } = await supabase
      .from("student_marks")
      .select("*")
      .eq("enrollment_number", enrollment)
      .order("term", { ascending: true});

    if (data) {
      setMarks(data);
      const uniqueTerms = [...new Set(data.map(m => m.term))];
      setTerms(uniqueTerms);
    }
  };

  const getTermMarks = (term: string) => {
    return marks.filter(m => m.term === term);
  };

  const calculateTermStats = (term: string) => {
    const termMarks = getTermMarks(term);
    const totalMarks = termMarks.reduce((sum, m) => sum + (m.total_marks || 0), 0);
    const totalCredits = termMarks.reduce((sum, m) => sum + (m.credits || 0), 0);
    const avgPercentage = termMarks.length > 0 
      ? termMarks.reduce((sum, m) => sum + ((m.total_marks || 0) / 100) * 100, 0) / termMarks.length 
      : 0;
    
    return { totalMarks, totalCredits, avgPercentage: Math.round(avgPercentage) };
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marks</h1>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>

        {terms.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No marks data available</p>
            </CardContent>
          </Card>
        ) : (
          terms.map((term) => {
            const termMarks = getTermMarks(term);
            const stats = calculateTermStats(term);

            return (
              <Card key={term}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {term}
                      </CardTitle>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Avg: </span>
                        <span className="font-bold">{stats.avgPercentage}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Credits: </span>
                        <span className="font-bold">{stats.totalCredits}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-right">Internal</TableHead>
                          <TableHead className="text-right">External</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Credits</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {termMarks.map((mark) => (
                          <TableRow key={mark.id}>
                            <TableCell className="font-medium">{mark.subject}</TableCell>
                            <TableCell className="text-right">{mark.internal_marks || '-'}</TableCell>
                            <TableCell className="text-right">{mark.external_marks || '-'}</TableCell>
                            <TableCell className="text-right font-bold">{mark.total_marks || '-'}</TableCell>
                            <TableCell className="text-right">{mark.credits || '-'}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {mark.grade || 'N/A'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
