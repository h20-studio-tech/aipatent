"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
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
  question: string;
  metaData: {
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }[]; // ✅ Fix: metaData is an array of objects
}

const ApproachInsights = forwardRef<ApproachInsightsRef, ApproachInsightsProps>(
  ({ response, metaData, question }, ref) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrollRef.current) return;
      isDragging.current = true;
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeft.current = scrollRef.current.scrollLeft;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !scrollRef.current) return;
        moveEvent.preventDefault();
        const x = moveEvent.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Adjust speed
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };
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

      if (typeof window !== "undefined" && window.addKnowledgeEntry) {
        window.addKnowledgeEntry("Approach", question, response);
      }

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
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Approach Meta-data</DialogTitle>{" "}
                      {/* ✅ Required for accessibility */}
                    </DialogHeader>
                    <div
                      className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto"
                      ref={scrollRef}
                      onMouseDown={handleMouseDown}
                    >
                      {metaData.length > 0 ? (
                        <div className="space-y-3 text-sm">
                          {metaData.map((item: any, index: number) => (
                            <div
                              key={`${item.chunk_id}-${index}`} // ✅ Ensure the key is unique
                              className="border border-gray-300 p-3 rounded-md"
                            >
                              <p>
                                <span className="font-semibold">Chunk ID:</span>{" "}
                                {item.chunk_id}
                              </p>
                              <p>
                                <span className="font-semibold">Filename:</span>{" "}
                                {item.filename}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Page Number:
                                </span>{" "}
                                {item.page_number}
                              </p>
                              <p>
                                <span className="font-semibold">Text:</span>{" "}
                                <span className="italic">{item.text}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">
                          No metadata available.
                        </p>
                      )}
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
