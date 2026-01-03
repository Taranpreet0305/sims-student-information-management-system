import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, RefreshCw, BookOpen, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIStudyRecommendationsProps {
  marks: any[];
  attendance?: any[];
}

export function AIStudyRecommendations({ marks, attendance }: AIStudyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateRecommendations = async () => {
    if (marks.length === 0) {
      toast.error("No marks data available for analysis");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'study_recommendations',
          data: {
            marks,
            attendance: attendance || [],
          }
        }
      });

      if (error) throw error;
      setRecommendations(data.response);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!hasGenerated) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Study Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized study tips based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateRecommendations} 
            disabled={loading || marks.length === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing your performance...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Study Recommendations
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={generateRecommendations}
            disabled={loading}
            className="h-8 w-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="space-y-3 text-sm">
            {recommendations.split('\n').map((line, i) => {
              if (!line.trim()) return null;
              
              // Style different sections
              if (line.includes('**') || line.startsWith('#')) {
                return (
                  <div key={i} className="flex items-start gap-2 font-medium text-primary">
                    <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{line.replace(/\*\*/g, '').replace(/^#+\s*/, '')}</span>
                  </div>
                );
              }
              
              if (line.match(/^\d+\./)) {
                return (
                  <div key={i} className="flex items-start gap-2 ml-2">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span>{line}</span>
                  </div>
                );
              }
              
              if (line.startsWith('-') || line.startsWith('•')) {
                return (
                  <div key={i} className="flex items-start gap-2 ml-4">
                    <TrendingUp className="h-3 w-3 mt-1 flex-shrink-0 text-green-500" />
                    <span>{line.replace(/^[-•]\s*/, '')}</span>
                  </div>
                );
              }
              
              return <p key={i} className="text-muted-foreground">{line}</p>;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
