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
let mockStoredKnowledge = [
  {
    id: 1,
    section: "Approach",
    question: "How are iPhone displays manufactured?",
    answer:
      "iPhone displays are manufactured through a complex process involving multiple layers of glass, OLED panels, and touch-sensitive components. The process begins with the production of ultra-thin glass substrates that are precisely cut to size. For OLED displays, organic light-emitting materials are deposited onto the substrate in microscopic patterns. The touch layer is created separately using indium tin oxide (ITO) conductors and then laminated to the display. Finally, the display assembly is bonded to a protective cover glass using optically clear adhesive that maintains visibility while providing durability.",
    timestamp: "2025-03-04T14:23:15Z",
    saved: true,
  },
  {
    id: 2,
    section: "Technology",
    question: "What materials are used in iPhone batteries?",
    answer:
      "iPhone batteries use lithium-ion technology with several key materials. The cathode typically contains lithium cobalt oxide (LiCoO₂) or more recently, lithium iron phosphate (LiFePO₄) for improved safety and longevity. The anode is made of graphite with silicon additives to increase capacity. The electrolyte consists of lithium salts in an organic solvent that allows ion movement between electrodes. The battery also includes a separator membrane, typically made of polyethylene or polypropylene, that prevents short circuits while allowing ions to pass through. Apple has been working to increase recycled content in these components and reduce dependence on cobalt and other rare materials.",
    timestamp: "2025-03-04T14:45:32Z",
    saved: true,
  },
  {
    id: 3,
    section: "Innovation",
    question: "How does Apple test iPhone durability?",
    answer:
      "Apple employs a comprehensive durability testing program for iPhones that includes both automated and real-world simulations. Devices undergo drop testing from various heights and angles onto different surfaces to evaluate structural integrity. Water resistance is tested in pressurized tanks that simulate different depths and exposure times. Climate chambers subject phones to extreme temperatures, humidity, and rapid environmental changes. Buttons and ports are mechanically actuated millions of times to ensure longevity. Additionally, Apple uses specialized equipment to test bend resistance, scratch resistance of displays, and camera performance under various conditions. These tests inform design improvements and help establish quality standards for manufacturing.",
    timestamp: "2025-03-04T15:12:08Z",
    saved: true,
  },
  {
    id: 4,
    section: "Approach",
    question: "What assembly techniques are used for iPhone circuit boards?",
    answer:
      "iPhone circuit boards (PCBs) are assembled using advanced surface-mount technology (SMT) and automated processes. The multi-layer boards first undergo solder paste application through precision stencil printing. Components are then placed by high-speed pick-and-place machines capable of positioning thousands of parts per hour with micron-level accuracy. The boards pass through reflow ovens where the solder melts and creates permanent connections. Automated optical inspection (AOI) and X-ray inspection verify proper component placement and solder joint quality. For certain components like processors and memory, ball grid array (BGA) technology is used, where connections are made via an array of solder balls beneath the component. Final testing includes electrical verification and functional testing before the PCB is integrated into the device assembly.",
    timestamp: "2025-03-04T15:37:45Z",
    saved: true,
  },
  {
    id: 5,
    section: "Technology",
    question: "How are iPhone cameras calibrated during manufacturing?",
    answer:
      "iPhone cameras undergo precise calibration during manufacturing to ensure optimal performance. Each camera module is placed in specialized testing equipment that evaluates focus accuracy, color reproduction, and image quality across different lighting conditions. Automated systems adjust the lens position at the micron level and store calibration data in device memory. For multi-camera systems, additional calibration ensures proper alignment between lenses for features like Portrait mode and AR applications. The calibration process also tests optical image stabilization by simulating hand movements and measuring compensation accuracy. Finally, each camera is tested for specific features like Night mode, Deep Fusion, and video stabilization to verify that image processing algorithms are functioning correctly with the calibrated hardware.",
    timestamp: "2025-03-04T16:05:21Z",
    saved: true,
  },
  {
    id: 6,
    section: "Innovation",
    question: "What recycling methods does Apple use for old iPhones?",
    answer:
      "Apple employs several innovative recycling methods for old iPhones through its Apple Trade In and recycling programs. The company uses a specialized robot called Daisy that can disassemble up to 200 iPhones per hour, carefully separating components for recovery. Daisy removes the battery, screws, and modules in a precise sequence to enable material recovery. Another robot system, Dave, disassembles the Taptic Engine to recover rare earth magnets, tungsten, and steel. The recovered materials are then processed to extract valuable elements like gold, copper, aluminum, and cobalt that can be reused in new products. Apple has developed specific recycling streams for battery components, which are particularly important for recovering cobalt and lithium. The company aims to eventually create a closed-loop manufacturing process where new products are made entirely from recycled materials.",
    timestamp: "2025-03-04T16:28:17Z",
    saved: true,
  },
];

interface StoredKnowledgeProps {
  chats: any[];
  stage: any;
  setStage: (stage: any) => void;
}

export default function StoredKnowledge({
  chats,
  stage,
  setStage,
}: StoredKnowledgeProps) {
  const [open, setOpen] = useState(false);
  const [localChats, setLocalChats] = useState(chats);
  const [hasNewItems, setHasNewItems] = useState(false);

  useEffect(() => {
    setLocalChats((prev) => {
      console.log("Hello", prev);
      const existingIds = new Set(prev.map((c) => c.id));
      const newChats = chats.filter((c) => !existingIds.has(c.id));
      return [...newChats, ...prev];
    });
  }, [chats]);

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
          detail: "Test",
        });
        window.dispatchEvent(event);
      }
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

      <Button
        variant="default"
        size="lg"
        className="absolute top-4 right-4 z-10"
        onClick={() => {
          if (stage === 1) {
            setStage(2);
          }
        }}
      >
        Next
      </Button>

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
      answer: string
    ) => any;
    generateApproachInsights?: () => void;
    generateTechnologyInsights?: () => void;
    generateInnovationInsights?: () => void;
  }
}
