// Editable: TechnologyInsights with Edit/Save support

"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  SetStateAction,
  Dispatch,
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

interface TechnologyInsightsRef {
  generateContent: () => void;
}

interface TechnologyInsightsProps {
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
}

const TechnologyInsights = forwardRef<
  TechnologyInsightsRef,
  TechnologyInsightsProps
>(
  (
    { response, metaData, question, lastSaved, setLastSaved, patentId },
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
        const generated = `# iPhone Technology Framework

Our analysis of the technical specifications and research papers has yielded the following technology framework for the iPhone:

## 1. Core Technologies

The iPhone leverages several cutting-edge technologies:

- **A-series/M-series Chips:** Custom ARM-based processors designed by Apple for optimal performance and energy efficiency
- **Neural Engine:** Dedicated neural network hardware for AI and ML operations
- **ProMotion Display:** Adaptive refresh rate technology up to 120Hz
- **TrueDepth Camera:** Advanced 3D sensing system for Face ID and AR applications
- **5G Modem:** Advanced cellular connectivity with mmWave support

## 2. Technical Architecture

The system architecture consists of four primary layers:

- **Hardware Layer:** Custom silicon, sensors, and input/output systems
- **System Software:** iOS core operating system and drivers
- **Services Layer:** iCloud, App Store, and other platform services
- **Application Layer:** First-party and third-party applications

## 3. Technical Innovations

Key technological innovations include:

- Custom silicon design with integrated CPU, GPU, and Neural Engine
- Advanced computational photography using multiple camera systems
- Secure Enclave for hardware-level security
- ProRAW image format for professional photography
- Ceramic Shield display technology for enhanced durability

## 4. Technical Specifications

Current specifications include:

- Display: Super Retina XDR OLED with ProMotion
- Processor: Latest A-series chip with 6-core CPU
- Memory: Up to 1TB storage and 6GB RAM
- Camera System: Triple 48MP, 12MP, 12MP rear cameras
- Battery: Up to 29 hours video playback
- Connectivity: 5G, Wi-Fi 6E, Ultra Wideband

## 5. Implementation Technologies

Key implementation technologies include:

- LTPO OLED display technology
- Advanced machine learning algorithms
- LiDAR scanning for AR applications
- MagSafe wireless charging system
- Ceramic Shield front cover

This technology framework demonstrates Apple's leadership in mobile computing, showcasing innovations in silicon design, display technology, camera systems, and security features.`;
        setContent(generated);
        setEditedContent(generated);
        setIsLoading(false);
      }, 2000);
    };

    const handleSave = () => {
      if (!editedContent.trim()) return;

      setIsSaving(true);
      if (typeof window !== "undefined" && window.addKnowledgeEntry) {
        window.addKnowledgeEntry("Technology", question, editedContent, patentId);
      }

      setTimeout(() => {
        setLastSaved(editedContent);
        setContent(editedContent);
        setIsSaving(false);
        setIsEditing(false);
        toast({
          title: "Insights saved successfully",
          description: "Your technology insights have been saved to the project.",
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
                Technology Insights
              </div>
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Meta-data</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Approach Meta-data</DialogTitle>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-y-auto">
                      {metaData.length > 0 ? (
                        <div className="space-y-3 text-sm">
                          {metaData.map((item, index) => (
                            <div key={`${item.chunk_id}-${index}`} className="border border-gray-300 p-3 rounded-md">
                              <p><span className="font-semibold">Chunk ID:</span> {item.chunk_id}</p>
                              <p><span className="font-semibold">Filename:</span> {item.filename}</p>
                              <p><span className="font-semibold">Page Number:</span> {item.page_number}</p>
                              <p><span className="font-semibold">Text:</span> <span className="italic">{item.text}</span></p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">No metadata available.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                {content && !isEditing && (
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />Edit
                  </Button>
                )}
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />{isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                      <X className="h-4 w-4 mr-2" />Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleSave} disabled={!content || isSaving || lastSaved === response}>
                    {lastSaved === response ? "Saved" : isSaving ? "Saving" : "Save"}
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
              )
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No insights generated yet</h3>
                  <p className="text-muted-foreground">Send a message in the chat to generate insights.</p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="font-medium">Generating Technology Insights...</p>
                  <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
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

TechnologyInsights.displayName = "TechnologyInsights";

export default TechnologyInsights;
