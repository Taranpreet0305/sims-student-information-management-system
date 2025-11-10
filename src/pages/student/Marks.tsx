import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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

  const chartData = marks.map((mark) => ({
    subject: mark.subject.substring(0, 15),
    marks: Number(mark.total_marks) || 0,
  }));

  const avgMarks = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + (Number(m.total_marks) || 0), 0) / marks.length)
    : 0;

  return (
    <StudentLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2">My Marks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View your academic performance and grades</p>
        </div>

        {marks.length > 0 && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{marks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Average Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{avgMarks}%</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {marks.reduce((sum, m) => sum + (m.credits || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {marks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  marks: {
                    label: "Marks",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="subject" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      domain={[0, 100]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

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
