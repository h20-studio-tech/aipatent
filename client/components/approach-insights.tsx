"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Define the ref type
interface ApproachInsightsRef {
  generateContent: () => void;
}

interface ApproachInsightsProps {
  response: string;
}

const ApproachInsights = forwardRef<ApproachInsightsRef>(
  ({ response }, ref) => {
    const [content, setContent] = useState<string | null>(response);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // ✅ Update content when `response` changes
    useEffect(() => {
      setContent(response);
    }, [response]);

    useImperativeHandle(ref, () => ({
      generateContent: () => {},
    }));

    const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        toast({
          title: "Insights saved successfully",
          description: "Your approach insights have been saved to the project.",
          duration: 3000,
        });
      }, 1000);
    };

    return (
      <>
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Approach Insights
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Meta-data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Approach Meta-data</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {`{
  "section": "Approach",
  "metadata": {
    "lastUpdated": "${new Date().toISOString()}",
    "status": "In Progress",
    "completionPercentage": 75,
    "contributors": ["AI Assistant", "Research Team"],
    "relatedDocuments": 3,
    "wordCount": 842,
    "keyInsights": 12
  }
}`}
                      </pre>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!content || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative">
            {content ? (
              <div className="prose max-w-none">
                {content.split("\n").map((line, index) => {
                  if (line.startsWith("# ")) {
                    return <h3 key={index}>{line.replace("# ", "")}</h3>;
                  } else if (line.startsWith("## ")) {
                    return <h4 key={index}>{line.replace("## ", "")}</h4>;
                  } else if (line.startsWith("- ")) {
                    return <li key={index}>{line.replace("- ", "")}</li>;
                  } else if (line.trim() === "") {
                    return <br key={index} />;
                  } else {
                    return <p key={index}>{line}</p>;
                  }
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No insights generated yet
                  </h3>
                  <p className="text-muted-foreground">
                    Send a message in the chat to generate insights.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="font-medium">Generating Approach Insights...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a few moments
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Toaster />
      </>
    );
  }
);

ApproachInsights.displayName = "ApproachInsights";

export default ApproachInsights;
