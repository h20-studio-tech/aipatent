"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, FileText } from "lucide-react";

// Mock data for stored knowledge

interface StoredKnowledgeProps {
  stage: number;
  setStage: (stage: number) => void;
}

export default function StoredKnowledge({
  stage,
  setStage,
}: StoredKnowledgeProps) {
  const [open, setOpen] = useState(false);
  const [localChats, setLocalChats] = useState<any[]>([]);
  const [hasNewItems, setHasNewItems] = useState(false);

  useEffect(() => {
    // Set the global function to update local state
    window.addResearchNote = (section: string, content: string) => {
      const newNote = {
        id: Date.now(),
        section,
        question: "Research Note",
        answer: content,
        timestamp: new Date().toISOString(),
        saved: true,
      };

      setLocalChats((prev) => [newNote, ...prev]);
      setHasNewItems(true);

      if (typeof window !== "undefined") {
        // Create a custom event that components can listen for
        const event = new CustomEvent("knowledgeEntryAdded", {
          detail: newNote,
        });
        window.dispatchEvent(event);
      }
    };

    window.addKnowledgeEntry = (
      section: string,
      question: string,
      answer: string,
      remixed?: boolean
    ) => {
      const newEntry = {
        id: new Date(),
        section: section,
        question: question,
        answer: answer,
        timestamp: new Date().toISOString(),
        saved: true,
        remixed: remixed ? true : false,
      };

      setLocalChats((prev) => [newEntry, ...prev]);
      setHasNewItems(true);

      // If we have a global event system, we could trigger an event here
      if (typeof window !== "undefined") {
        // Create a custom event that components can listen for
        const event = new CustomEvent("knowledgeEntryAdded", {
          detail: newEntry,
        });
        window.dispatchEvent(event);
      }

      return newEntry;
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

      {stage === 1 ? (
        <Button
          variant="default"
          size="lg"
          className="absolute top-4 right-4 z-10"
          onClick={() => setStage(2)}
        >
          Next
        </Button>
      ) : (
        <Button
          variant="default"
          size="lg"
          className="absolute top-4 right-4 z-10"
          onClick={() => setStage(1)}
        >
          Prev
        </Button>
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
    addResearchNote?: (section: string, content: string) => any;
    addKnowledgeEntry?: (
      section: string,
      question: string,
      answer: string,
      remixed?: boolean
    ) => any;
    generateApproachInsights?: () => void;
    generateTechnologyInsights?: () => void;
    generateInnovationInsights?: () => void;
  }
}
