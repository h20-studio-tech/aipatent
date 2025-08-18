// Editable: InnovationInsights with Edit/Save support

"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  Dispatch,
  SetStateAction,
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
import { FileText, Loader2, Save, Edit, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Textarea } from "@/components/ui/textarea";
import { CitedMessage, Footnotes } from "@/components/citation-link";

interface InnovationInsightsRef {
  generateContent: () => void;
}

interface InnovationInsightsProps {
  response: string;
  question: string;
  metaData: {
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }[];
  lastSaved: string;
  patentId: string;
  setLastSaved: Dispatch<SetStateAction<string>>;
  onCitationClick?: (chunkId: number) => void;
}

const InnovationInsights = forwardRef<
  InnovationInsightsRef,
  InnovationInsightsProps
>(
  (
    { response, metaData, question, lastSaved, setLastSaved, patentId, onCitationClick },
    ref
  ) => {
    const [content, setContent] = useState<string | null>(response);
    const [editedContent, setEditedContent] = useState<string>(response);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      generateContent: () => {
        generateContent();
      },
    }));

    useEffect(() => {
      setContent(response);
      setEditedContent(response);
    }, [response]);

    const generateContent = () => {
      setIsLoading(true);

      setTimeout(() => {
        const generated = `# iPhone Innovation Framework

Based on our market analysis and technical research, we've identified the following innovation framework for the iPhone:

## 1. Market Gap Analysis

The iPhone addresses several critical market needs:

- **User Experience:** Intuitive interface that redefined mobile interaction
- **Integration:** Seamless ecosystem connecting devices and services
- **Security:** Advanced protection of user data and privacy
- **Performance:** Balance of power and efficiency in mobile computing

## 2. Novel Elements

Key innovations that differentiate the iPhone:

- **Face ID:** Revolutionary 3D facial recognition system
- **Apple Silicon:** Custom chip design for optimal performance
- **ProMotion:** Adaptive refresh rate display technology
- **Computational Photography:** Advanced image processing capabilities

## 3. Competitive Advantage

The iPhone maintains market leadership through:

- **Vertical Integration:** Control over hardware, software, and services
- **Brand Premium:** Strong market position and customer loyalty
- **App Ecosystem:** Largest mobile software marketplace
- **Privacy Focus:** Industry-leading security features

## 4. Market Applications

The iPhone serves multiple market segments:

- **Consumer:** Primary smartphone for daily use
- **Professional:** Creative and business tools
- **Enterprise:** Secure corporate deployment
- **Healthcare:** Medical imaging and monitoring
- **Education:** Learning and development platform

## 5. Innovation Strategy

Apple's ongoing innovation strategy includes:

- Annual hardware upgrades with significant improvements
- Regular software updates with new features
- Expansion into new use cases (AR/VR)
- Environmental sustainability initiatives
- Privacy-focused feature development

This innovation framework demonstrates Apple's commitment to pushing boundaries in mobile technology while maintaining user trust and satisfaction.`;
        setContent(generated);
        setEditedContent(generated);
        setIsLoading(false);
      }, 2000);
    };

    const handleSave = () => {
      if (!editedContent.trim()) return;

      setIsSaving(true);

      if (typeof window !== "undefined" && window.addKnowledgeEntry) {
        window.addKnowledgeEntry(
          "Innovation",
          question,
          editedContent,
          patentId
        );
      }

      setTimeout(() => {
        setContent(editedContent);
        setLastSaved(editedContent);
        setIsSaving(false);
        setIsEditing(false);
        toast({
          title: "Insights saved successfully",
          description:
            "Your innovation insights have been saved to the project.",
          duration: 3000,
        });
      }, 1000);
    };

    const handleEdit = () => {
      setIsEditing(true);
      setEditedContent(content || "");
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedContent(content || "");
    };

    return (
      <>
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Innovation Insights
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  {/* <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Meta-data</Button>
                  </DialogTrigger> */}
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Approach Meta-data</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-y-auto">
                      {metaData.length > 0 ? (
                        <div className="space-y-3 text-sm">
                          {metaData.map((item, index) => (
                            <div
                              key={`${item.chunk_id}-${index}`}
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
                {content && !isEditing && (
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!content || isSaving || lastSaved === response}
                  >
                    {lastSaved === response
                      ? "Saved"
                      : isSaving
                      ? "Saving"
                      : "Save"}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative">
            {content ? (
              isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="prose max-w-none">
                  {onCitationClick ? (
                    <>
                      <CitedMessage 
                        message={content} 
                        chunks={metaData} 
                        onCitationClick={onCitationClick} 
                      />
                      <Footnotes 
                        message={content} 
                        chunks={metaData} 
                        onCitationClick={onCitationClick} 
                      />
                    </>
                  ) : (
                    content.split("\n").map((line, index) => {
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
                    })
                  )}
                </div>
              )
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
                  <p className="font-medium">
                    Generating Innovation Insights...
                  </p>
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

InnovationInsights.displayName = "InnovationInsights";

export default InnovationInsights;
