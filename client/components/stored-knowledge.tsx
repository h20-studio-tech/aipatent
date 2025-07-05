// Refactored: Fix mixed data on tab reopen by tracking current tab with state and syncing filtering

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileDown, FileText, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { backendUrl } from "@/config/config";

interface DBData {
  id: string;
  section: string;
  question: string;
  answer: string;
  timestamp: string;
  saved: boolean;
  remixed?: boolean;
}

interface SectionMetadata {}
interface SavedPatentData {
  editedComponents: Record<string, string>;
  sectionMetadata: Record<string, SectionMetadata>;
  currentSectionIndex: number;
  currentSubsectionIndex: number;
  lastGeneratedSection: string | null;
  lastGeneratedSubsection: string | null;
  timestamp: number;
}

const STORAGE_KEY = "patent_generator_progress";

interface StoredKnowledgeProps {
  stage: number;
  setStage: (stage: number) => void;
}

export default function StoredKnowledge({
  stage,
  setStage,
}: StoredKnowledgeProps) {
  const [open, setOpen] = useState(false);
  const [localChats, setLocalChats] = useState<DBData[]>([]);
  const [hasNewItems, setHasNewItems] = useState(false);
  const [activeTab, setActiveTab] = useState("other");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editedComponents, setEditedComponents] = useState<
    Record<string, string>
  >({});
  const [lastGeneratedSubsection, setLastGeneratedSubsection] = useState<
    string | null
  >(null);
  const [lastGeneratedSection, setLastGeneratedSection] = useState<
    string | null
  >(null);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const [sectionMetadata, setSectionMetadata] = useState<
    Record<string, SectionMetadata>
  >({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

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
      const newNote = {
        id: `${Date.now()}-${Math.random()}`,
        section: data.section,
        question: data.question,
        answer: data.answer,
        timestamp: data.timestamp,
        saved: true,
      };
      setLocalChats((prev) => [newNote, ...prev]);
      window.__globalKnowledgeCache.push(newNote);
      setHasNewItems(true);
    };

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
        await axios.post(`${backendUrl}/v1/knowledge/research-note`, payload);
      } catch (err: any) {
        console.error("API Error:", err?.response?.data || err.message);
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
      window.__globalKnowledgeCache.push(newNote);
      setHasNewItems(true);

      window.dispatchEvent(
        new CustomEvent("researchNoteAdded", { detail: newNote })
      );

      return newNote;
    };

    window.addKnowledgeEntry = async (
      section: string,
      question: string,
      answer: string,
      patentId?: string,
      remixed?: boolean
    ) => {
      const payload = {
        patent_id: patentId,
        question,
        answer,
        created_at: new Date().toISOString(),
      };

      try {
        let endpoint = "";
        if (section === "Approach")
          endpoint = `${backendUrl}/v1/knowledge/approach`;
        if (section === "Technology")
          endpoint = `${backendUrl}/v1/knowledge/technology`;
        if (section === "Innovation")
          endpoint = `${backendUrl}/v1/knowledge/innovation`;

        if (endpoint) await axios.post(endpoint, payload);
      } catch (err: any) {
        console.error("API Error:", err?.response?.data || err?.message);
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

      setLocalChats((prev) => [newEntry, ...prev]);
      window.__globalKnowledgeCache.push(newEntry);
      setHasNewItems(true);

      window.dispatchEvent(
        new CustomEvent("knowledgeEntryAdded", { detail: newEntry })
      );

      return newEntry;
    };

    window.getStoredKnowlegde = async () => {
      return window.__globalKnowledgeCache || [];
    };
  }, []);

  const getFilteredKnowledge = (section: string) => {
    const mainSections = ["approach", "technology", "innovation"];
    if (section === "other") {
      return localChats.filter(
        (item) => !mainSections.includes(item.section.toLowerCase())
      );
    }
    return localChats.filter((item) => item.section.toLowerCase() === section);
  };

  useEffect(() => {
    const handleNewItem = () => setHasNewItems(true);
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
      toast({
        title: "Success",
        description: "Progress saved successfully!",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
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

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-2">
              <TabsTrigger value="other">Other</TabsTrigger>
              <TabsTrigger value="approach">Approach</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
              <TabsTrigger value="innovation">Innovation</TabsTrigger>
            </TabsList>

            {["other", "approach", "technology", "innovation"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6 py-4">
                    {getFilteredKnowledge(tab).length > 0 ? (
                      getFilteredKnowledge(tab).map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="bg-muted px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.section}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {new Date(item.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {item.saved && item.remixed ? "Remixed" : "Saved"}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            {item.question === "Research Note" ? (
                              <div className="bg-primary/5 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <p className="font-medium text-sm">
                                    Research Note
                                  </p>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                  {item.answer}
                                </p>
                              </div>
                            ) : (
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
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-10">
                        No knowledge items in this section yet.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
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
