"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, FileDown, FileText, Save } from "lucide-react";
import axios from "axios";
import { backendUrl } from "@/config/config";
import { toast } from "./ui/use-toast";
import { SectionMetadata } from "./resizeable-section";

interface SavedPatentData {
  editedComponents: Record<string, string>;
  sectionMetadata: Record<string, SectionMetadata>;
  currentSectionIndex: number;
  currentSubsectionIndex: number;
  lastGeneratedSection: string | null;
  lastGeneratedSubsection: string | null;
  timestamp: number;
}
interface DBData {
  patentId: number;
  question: string;
  answer: string;
  section: string;
  timestamp: string;
}

interface StoredKnowledgeProps {
  stage: number;
  setStage: (stage: number) => void;
}

export default function StoredKnowledge({
  stage,
  setStage,
}: StoredKnowledgeProps) {
  const STORAGE_KEY = "patent_generator_progress";
  const [open, setOpen] = useState(false);
  const [localChats, setLocalChats] = useState<any[]>([]);
  const [hasNewItems, setHasNewItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editedComponents, setEditedComponents] = useState<
    Record<string, string>
  >({});
  const [lastGeneratedSection, setLastGeneratedSection] = useState<
    string | null
  >(null);
  const [lastGeneratedSubsection, setLastGeneratedSubsection] = useState<
    string | null
  >(null);
  const [sectionMetadata, setSectionMetadata] = useState<
    Record<string, SectionMetadata>
  >({});
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const handleGeneratePDF = async () => {
    if (Object.keys(editedComponents).length === 0) return;

    setIsGeneratingPDF(true);
    setError(null);

    try {
      // Simulate PDF generation with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you would generate the PDF here
      console.log("Generated PDF with sections:", editedComponents);

      // Show success toast
      toast({
        title: "Success",
        description: "PDF generated successfully!",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    window.__globalKnowledgeCache = [];
    window.addStoredData = async (type: string, data: DBData) => {
      if (type === "knowledge") {
        const newNote = {
          id: `${Date.now()}-${Math.random()}`,
          section: data.section,
          question: data.question,
          answer: data.answer,
          timestamp: data.timestamp,
          saved: true,
        };

        setLocalChats((prev) =>
          [newNote, ...prev].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
        window.__globalKnowledgeCache.push(newNote);
      } else {
        const newNote = {
          id: `${Date.now()}-${Math.random()}`,
          section: data.section,
          question: data.question,
          answer: data.answer,
          timestamp: data.timestamp,
          saved: true,
        };

        setLocalChats((prev) =>
          [newNote, ...prev].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
        window.__globalKnowledgeCache.push(newNote);
      }
    };
    // Set the global function to update local state
    window.addResearchNote = async (
      section: string,
      content: string,
      patentId: string
    ) => {
      const payload = {
        patent_id: patentId,
        category: "Research Note",
        content: content,
        created_at: new Date().toISOString(),
      };

      try {
        const response = await axios.post(
          `${backendUrl}/v1/knowledge/research-note`,
          payload
        );
        console.log("✅ API Response:", response?.data);
      } catch (err: any) {
        console.error("❌ API Error:", err?.response?.data || err.message);
      }

      const newNote = {
        id: `${Date.now()}-${Math.random()}`,
        section,
        question: "Research Note",
        answer: content,
        timestamp: new Date().toISOString(),
        saved: true,
      };

      setLocalChats((prev) => [newNote, ...prev]);
      setHasNewItems(true);
      window.__globalKnowledgeCache.push(newNote);

      if (typeof window !== "undefined") {
        const event = new CustomEvent("knowledgeEntryAdded", {
          detail: newNote,
        });
        window.dispatchEvent(event);
      }

      return newNote;
    };

    window.getStoredKnowlegde = async () => {
      console.log("Here", localChats);

      return window.__globalKnowledgeCache || [];
    };

    window.addKnowledgeEntry = async (
      section: string,
      question: string,
      answer: string,
      patentId?: string,
      remixed?: boolean
    ) => {
      console.log("PatentId -----------", patentId);

      const payload = {
        patent_id: patentId,
        question,
        answer,
        created_at: new Date().toISOString(),
      };

      try {
        let endpoint = "";

        if (section === "Approach") {
          endpoint = `${backendUrl}/v1/knowledge/approach`;
        } else if (section === "Technology") {
          endpoint = `${backendUrl}/v1/knowledge/technology`;
        } else if (section === "Innovation") {
          endpoint = `${backendUrl}/v1/knowledge/innovation`;
        }

        if (endpoint) {
          const response = await axios.post(endpoint, payload);
          console.log("✅ API Success:", response?.data);
        }
      } catch (err: any) {
        console.error("❌ API Error:", err?.response?.data || err?.message);
      }

      const newEntry = {
        id: `${Date.now()}-${Math.random()}`,
        section,
        question,
        answer,
        timestamp: new Date().toISOString(),
        saved: true,
        remixed: remixed ?? false,
      };

      // Always store locally
      setLocalChats((prev) => [newEntry, ...prev]);
      setHasNewItems(true);
      window.__globalKnowledgeCache.push(newEntry);

      if (typeof window !== "undefined") {
        const event = new CustomEvent("knowledgeEntryAdded", {
          detail: newEntry,
        });
        window.dispatchEvent(event);
      }

      return newEntry;
    };

    window.setLastGeneratedSection = async (section) => {
      setLastGeneratedSection(section);
    };
    window.setLastGeneratedSubSection = async (section) => {
      setLastGeneratedSubsection(section);
    };
    window.setIsLoading = async (bool) => {
      setIsLoading(bool);
    };
    window.setIsGeneratingPDF = async (bool) => {
      setIsGeneratingPDF(bool);
    };
    window.setEditComponents = async (key, content) => {
      setEditedComponents((prev) => ({
        ...prev,
        [key]: content,
      }));
    };
  }, []);

  useEffect(() => {
    const handleNewItem = () => {
      setHasNewItems(true);
    };

    window.addEventListener("researchNoteAdded", handleNewItem);
    window.addEventListener("knowledgeEntryAdded", handleNewItem);

    return () => {
      window.removeEventListener("researchNoteAdded", handleNewItem);
      window.removeEventListener("knowledgeEntryAdded", handleNewItem);
    };
  }, []);

  const saveProgress = useCallback(() => {
    setIsSaving(true);

    try {
      const dataToSave: SavedPatentData = {
        editedComponents,
        sectionMetadata,
        currentSectionIndex,
        currentSubsectionIndex,
        lastGeneratedSection,
        lastGeneratedSubsection,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      // Show success toast
      toast({
        title: "Success",
        description: "Progress saved successfully!",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error saving progress:", err);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    editedComponents,
    sectionMetadata,
    currentSectionIndex,
    currentSubsectionIndex,
    lastGeneratedSection,
    lastGeneratedSubsection,
    toast,
  ]);

  return (
    <>
      <Button
        variant="outline"
        className="absolute top-4 left-4 z-10 flex items-center gap-2"
        onClick={() => {
          setOpen(true);
          setHasNewItems(false);
        }}
      >
        <div className="relative">
          <Database className="h-4 w-4" />
          {hasNewItems && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        Stored Knowledge
        {hasNewItems && (
          <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
            New
          </span>
        )}
      </Button>

      {stage === 1 && (
        <Button
          variant="default"
          size="lg"
          className="absolute top-4 right-4 z-10"
          onClick={() => setStage(2)}
        >
          Next
        </Button>
      )}

      {stage === 2 && (
        <div className="absolute top-4 right-4 z-10 flex gap-4">
          <Button variant="default" size="lg" onClick={() => setStage(1)}>
            Prev
          </Button>
          <Button variant="default" size="lg" onClick={() => setStage(3)}>
            Next
          </Button>
        </div>
      )}

      {stage === 3 && (
        <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center justify-end gap-4">
          <Button variant="default" size="lg" onClick={() => setStage(2)}>
            Prev
          </Button>

          <Button
            variant="outline"
            onClick={saveProgress}
            className="flex items-center gap-2"
            disabled={
              isLoading ||
              isSaving ||
              Object.keys(editedComponents).length === 0
            }
          >
            {isSaving ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Progress
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            className="flex items-center gap-2"
            disabled={
              isLoading ||
              isGeneratingPDF ||
              Object.keys(editedComponents).length === 0
            }
          >
            {isGeneratingPDF ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </span>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5" />
              Stored Knowledge Database
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {localChats.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.section}</span>
                      <span className="text-muted-foreground text-sm">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {item.saved && item.remixed ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Remixed
                      </span>
                    ) : (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {item.question === "Research Note" ? (
                      // Research Note format
                      <div className="bg-primary/5 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <p className="font-medium text-sm">Research Note</p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
                    ) : (
                      // Regular Q&A format
                      <>
                        <div className="bg-accent/30 p-3 rounded-md">
                          <p className="font-medium text-sm">
                            Q: {item.question}
                          </p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-md">
                          <p className="text-sm">A: {item.answer}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

declare global {
  interface Window {
    addStoredData?: (type: string, data: DBData) => any;
    addResearchNote?: (
      section: string,
      content: string,
      patentId: string
    ) => any;
    addKnowledgeEntry?: (
      section: string,
      question: string,
      answer: string,
      patentId?: string,
      remixed?: boolean
    ) => any;
    getStoredKnowlegde: () => any;
    setLastGeneratedSection: (section: any) => any;
    setIsLoading: (bool: boolean) => void;
    setIsGeneratingPDF: (bool: boolean) => void;
    setLastGeneratedSubSection: (section: any) => any;
    setEditComponents: (key: any, content: any) => any;
    generateApproachInsights?: () => void;
    generateTechnologyInsights?: () => void;
    generateInnovationInsights?: () => void;
    __globalKnowledgeCache: any[];
  }
}
