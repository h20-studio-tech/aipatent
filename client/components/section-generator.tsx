"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import { generatePatentContent } from "@/app/actions/generate-patent-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResizableSection, type SectionMetadata } from "./resizeable-section";
import {
  Save,
  FileDown,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "./ui/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { backendUrl } from "@/config/config";
import axios from "axios";
import StoredKnowledge from "./stored-knowledge";

interface PatentComponentGeneratorProps {
  patentContext: string;
  onComponentGenerated: (component: string) => void;
  generatedComponents: string[];
  antigen?: string;
  disease?: string;
  stage: number;
  setStage: (stage: number) => void;
}

interface RawData {
  abstract?: string;
  keyterms?: string;
  summary?: string;
  description?: string;
  claims?: string;
  [key: string]: string | undefined; // To support dynamic keys like `description_header_*`
}

interface SavedPatentData {
  editedComponents: Record<string, string>;
  sectionMetadata: Record<string, SectionMetadata>;
  currentSectionIndex: number;
  currentSubsectionIndex: number;
  lastGeneratedSection: string | null;
  lastGeneratedSubsection: string | null;
  timestamp: number;
}

// Define the main sections (hardcoded headers)
// Removed "Figures/Diagrams" as requested

// const MAIN_SECTIONS = [
//   "Background",
//   "Summary of Invention",
//   "Target Overview",
//   "Underlying Mechanism",
//   "High Level Concept",
//   "Terms / Definitions",
//   "Disease Rationale",
//   "Formulations & Variations",
//   "Claims",
// ];

// const SUBSECTIONS: Record<string, string[]> = {
//   Background: ["Background"],
//   "Summary of Invention": ["Summary of Invention"],
//   "Target Overview": ["Target Overview"],
//   "Underlying Mechanism": ["Underlying Mechanism"],
//   "High Level Concept": ["High Level Concept"],
//   "Terms / Definitions": ["Terms / Definitions"],
//   "Disease Rationale": ["Disease Rationale"],
//   "Formulations & Variations": ["Formulations & Variations"],
//   Claims: ["Claims"],
// };

const MAIN_SECTIONS = [
  "Background",
  "Summary of Invention",
  "Field of Invention",
  "Target Overview",
  "Disease Rationale",
  "Underlying Mechanism",
  "High Level Concept",
  "Claims",
  "Abstract",
];

const SUBSECTIONS: Record<string, string[]> = {
  Background: ["Background"],
  "Summary of Invention": ["Summary of Invention"],
  "Field of Invention": ["Field of Invention"],
  "Target Overview": ["Target Overview"],
  "Disease Rationale": ["Disease Rationale"],
  "Underlying Mechanism": ["Underlying Mechanism"],
  "High Level Concept": ["High Level Concept"],
  // "Terms / Definitions": ["Terms / Definitions"],
  // "Disease Rationale": ["Disease Rationale"],
  // "Formulations & Variations": ["Formulations & Variations"],
  Claims: ["Claims"],
  Abstract: ["Abstract"],
};

const STORAGE_KEY = "patent_generator_progress";

const PatentComponentGenerator: React.FC<PatentComponentGeneratorProps> = ({
  patentContext,
  onComponentGenerated,
  generatedComponents,
  antigen,
  disease,
  stage,
  setStage,
}) => {
  const { toast } = useToast();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const currentSection = MAIN_SECTIONS[currentSectionIndex];
  const currentSubsections = SUBSECTIONS[currentSection];
  const currentSubsection = currentSubsections?.[currentSubsectionIndex];
  const [embodimentPages, setEmbdoimentPages] = useState<any>({});
  const [showSplitScreen, setShowSplitScreen] = useState<boolean>(true);
  const [sourcesPanelCollapsed, setSourcesPanelCollapsed] =
    useState<boolean>(false);
  const [splitScreenContent, setSplitScreenContent] = useState({
    title: "All Sources",
    content: "",
  });

  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [patentName, setPatentName] = useState<string | null>(null);
  const [patentId, setPatentId] = useState<string>("");
  const [userCorrection, setUserCorrection] = useState("");
  const [regenerateInput, setRegenerateInput] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const latestGeneratedRef = useRef<HTMLDivElement>(null);
  const correctionRef = useRef<HTMLTextAreaElement>(null);
  const regenerateRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rawData, setRawData] = useState<RawData>({
    keyterms: "",
    summary: "",
    description: "",
    claims: "",
  });
  const [lastGeneratedSection, setLastGeneratedSection] = useState<
    string | null
  >(null);
  const [lastGeneratedSubsection, setLastGeneratedSubsection] = useState<
    string | null
  >(null);
  const [editedComponents, setEditedComponents] = useState<
    Record<string, string>
  >({});
  const [sectionMetadata, setSectionMetadata] = useState<
    Record<string, SectionMetadata>
  >({});
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Check if we've reached the end of the generation sequence
  const isGenerationComplete = useCallback(() => {
    // If we're at the last section
    if (currentSectionIndex === MAIN_SECTIONS.length - 1) {
      // And we're at the last subsection or beyond
      if (currentSubsectionIndex >= SUBSECTIONS[currentSection].length) {
        return true;
      }
    }
    return false;
  }, [currentSection, currentSectionIndex, currentSubsectionIndex]);

  // Initialize expandedSections
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    MAIN_SECTIONS.forEach((section) => {
      initialExpandedState[section] = true;
    });
    setExpandedSections(initialExpandedState);
  }, []);

  // Load saved progress automatically when the component mounts
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: SavedPatentData = JSON.parse(savedData);

        // Restore state from saved data
        setEditedComponents(parsedData.editedComponents || {});
        setSectionMetadata(parsedData.sectionMetadata || {});
        setCurrentSectionIndex(parsedData.currentSectionIndex);
        setCurrentSubsectionIndex(parsedData.currentSubsectionIndex);
        setLastGeneratedSection(parsedData.lastGeneratedSection);
        setLastGeneratedSubsection(parsedData.lastGeneratedSubsection);
      }
    } catch (err) {
      console.error("Error loading saved progress:", err);
      setError("Failed to load saved progress");
    }
  }, []);

  // Auto-scroll to the latest generated content
  useEffect(() => {
    if (generatedContent && latestGeneratedRef.current) {
      // Place the reference at the end of the content
      setTimeout(() => {
        latestGeneratedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [generatedContent]);

  const fetchStoredKnowledge = async () => {
    if (typeof window !== "undefined" && window.getStoredKnowlegde) {
      const storedKnowledge = await window.getStoredKnowlegde();
      console.log("DFvdf", storedKnowledge);

      let approachKnowledge;
      let innovationKnowledge;
      let technologyKnowledge;

      for (const knowledge of storedKnowledge) {
        if (knowledge.section === "Approach") {
          approachKnowledge = knowledge;
        }

        if (knowledge.section === "Innovation") {
          innovationKnowledge = knowledge;
        }

        if (knowledge.section === "Technology") {
          technologyKnowledge = knowledge;
        }
      }
      return {
        approachKnowledge,
        innovationKnowledge,
        technologyKnowledge,
      };
    }
  };

  // Save current progress
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

  const fetchRawContent = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/v1/raw-sections/${patentId}`
      );

      const embodimentsRawResponse = await axios.get(
        `${backendUrl}/v1/pages/${patentId}`
      );
      console.log("Hello pp emb", embodimentsRawResponse);

      setEmbdoimentPages(embodimentsRawResponse.data.pages);
      const { sections } = response.data;

      const formatted: RawData = {
        keyterms:
          sections?.["key terms"] || "No Raw Data Found for this section",
        summary:
          sections?.["summary of invention"] ||
          "No Raw Data Found for this section",
        description:
          sections?.["detailed description"] ||
          "No Raw Data Found for this section",
        claims: sections?.["claims"] || "No Raw Data Found for this section",
      };

      for (const [key, value] of Object.entries(sections || {})) {
        if (
          ![
            "key terms",
            "summary of invention",
            "detailed description",
            "claims",
          ].includes(key)
        ) {
          formatted[slugify(key)] = value;
        }
      }

      setRawData(formatted);
    } catch (err) {
      console.error("Error fetching raw content:", err);
      // toast({
      //   title: "Error",
      //   description: "Error while fetching raw text.",
      //   variant: "destructive",
      // });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentId(params.get("patentId"));
    }
  }, []);

  useEffect(() => {
    if (patentId) {
      fetchRawContent();
    }
  }, [patentId]);

  const handleGenerate = useCallback(async () => {
    if (typeof window !== "undefined" && window.setIsLoading) {
      window.setIsLoading(true);
    }
    setIsLoading(true);
    setError(null);

    // Store the current section and subsection before generating
    const sectionToGenerate = currentSection;
    const subsectionToGenerate = currentSubsection;
    console.log("Section", sectionToGenerate);
    setLastGeneratedSection(sectionToGenerate);
    setLastGeneratedSubsection(subsectionToGenerate);

    if (typeof window !== "undefined" && window.setLastGeneratedSection) {
      window.setLastGeneratedSection(sectionToGenerate);
    }
    if (typeof window !== "undefined" && window.setLastGeneratedSubSection) {
      window.setLastGeneratedSubSection(subsectionToGenerate);
    }

    try {
      // Create a prompt that includes the context of the section
      const enhancedContext = `${patentContext}

Please generate the "${sectionToGenerate}" section of the patent.
This section should be detailed, technically accurate, and formatted appropriately for a patent document.`;
      const storedKnowledge = await fetchStoredKnowledge();

      console.log("Stored", storedKnowledge);
      console.log("Antigen", antigen);
      console.log("Disease", disease);

      if (!antigen || !disease) {
        console.warn("Missing critical data:", { antigen, disease });
      }
      const content = await generatePatentContent(
        sectionToGenerate,
        enhancedContext,
        antigen,
        disease,
        storedKnowledge?.innovationKnowledge?.answer || "",
        storedKnowledge?.approachKnowledge?.answer || "",
        storedKnowledge?.technologyKnowledge?.answer || "",
        "test",
        "test"
      );
      setGeneratedContent(content);

      console.log("first", content);

      // Create a unique key for this section
      const componentKey = `${sectionToGenerate}:${subsectionToGenerate}`;

      // Create metadata for the new section
      const newMetadata: SectionMetadata = {
        type: sectionToGenerate,
        timestamp: Date.now(),
        regenerationCount: 0,
      };

      // Update our local edited components state
      setEditedComponents((prev) => ({
        ...prev,
        [componentKey]: content,
      }));

      if (typeof window !== "undefined" && window.setEditComponents) {
        window.setEditComponents(componentKey, content);
      }

      // Update metadata
      setSectionMetadata((prev) => ({
        ...prev,
        [componentKey]: newMetadata,
      }));

      // Move to next section
      moveToNextSubsection();

      // Show success toast
      toast({
        title: "Success",
        description: `${sectionToGenerate} section generated successfully!`,
        duration: 3000,
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate content";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      if (typeof window !== "undefined" && window.setIsLoading) {
        window.setIsLoading(false);
      }
      setIsLoading(false);
    }
  }, [currentSection, currentSubsection, patentContext, toast]);

  const moveToNextSubsection = () => {
    // Since each section only has one subsection (itself), we always move to the next section
    if (currentSectionIndex < MAIN_SECTIONS.length - 1) {
      // Move to the next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentSubsectionIndex(0);
    } else {
      // We've reached the end of all sections
      // Set the index beyond the last subsection to trigger the "Generate PDF" button
      setCurrentSubsectionIndex(1); // Since each section has only one subsection
    }
  };

  const handleRegenerateWithCorrections = async () => {
    // Get the latest correction from the textarea
    const correctionText = regenerateRef.current?.value || regenerateInput;

    if (!correctionText.trim()) {
      setError("Please provide guidance before regenerating");
      toast({
        title: "Error",
        description: "Please provide guidance before regenerating",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setRegenerateModalOpen(false);

    if (typeof window !== "undefined" && window.setIsLoading) {
      window.setIsLoading(true);
    }
    setIsLoading(true);
    setError(null);

    try {
      // Use the last generated section for regeneration
      const sectionToRegenerate = lastGeneratedSection || MAIN_SECTIONS[0];
      const subsectionToRegenerate = sectionToRegenerate; // Since subsection is the same as section

      // Create a unique key for this section
      const componentKey = `${sectionToRegenerate}:${subsectionToRegenerate}`;

      // Get the current content of the section we're regenerating
      const currentSectionContent =
        editedComponents[componentKey] || generatedContent;

      const correctedPrompt = `${patentContext}

Previous content: ${currentSectionContent}

User guidance: ${correctionText}

Please regenerate the "${sectionToRegenerate}" section based on this guidance.
This section should be detailed, technically accurate, and formatted appropriately for a patent document.`;

      const storedKnowledge = await fetchStoredKnowledge();

      console.log("Stored", storedKnowledge);
      console.log("Antigen", antigen);
      console.log("Disease", disease);

      if (!antigen || !disease) {
        console.warn("Missing critical data:", { antigen, disease });
      }
      const regeneratedText = await generatePatentContent(
        sectionToRegenerate,
        correctedPrompt,
        antigen,
        disease,
        storedKnowledge?.innovationKnowledge?.answer || "",
        storedKnowledge?.approachKnowledge?.answer || "",
        storedKnowledge?.technologyKnowledge?.answer || "",
        "test",
        "test"
      );

      // Update the current content with the regenerated text
      setGeneratedContent(regeneratedText);

      // Update the edited components state
      setEditedComponents((prev) => ({
        ...prev,
        [componentKey]: regeneratedText,
      }));

      // Update the metadata for this section
      setSectionMetadata((prev) => {
        const existingMetadata = prev[componentKey] || {
          type: sectionToRegenerate,
          timestamp: Date.now(),
          regenerationCount: 0,
        };

        return {
          ...prev,
          [componentKey]: {
            ...existingMetadata,
            lastEdited: Date.now(),
            userGuidance: correctionText,
            regenerationCount: (existingMetadata.regenerationCount || 0) + 1,
          },
        };
      });

      setRegenerateInput("");

      // Show success toast
      toast({
        title: "Success",
        description: `${sectionToRegenerate} section successfully regenerated!`,
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Error regenerating content:", err);
      const errorMessage = `Failed to regenerate content: ${
        err instanceof Error ? err.message : String(err)
      }`;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      if (typeof window !== "undefined" && window.setIsLoading) {
        window.setIsLoading(false);
      }
      setIsLoading(false);
    }
  };

  const handleContentChange = (
    sectionType: string,
    subsectionType: string,
    newContent: string
  ) => {
    const componentKey = `${sectionType}:${subsectionType}`;

    setEditedComponents((prev) => ({
      ...prev,
      [componentKey]: newContent,
    }));

    // Update metadata to reflect the edit
    setSectionMetadata((prev) => {
      const existingMetadata = prev[componentKey] || {
        type: sectionType,
        timestamp: Date.now(),
        regenerationCount: 0,
      };

      return {
        ...prev,
        [componentKey]: {
          ...existingMetadata,
          lastEdited: Date.now(),
        },
      };
    });
  };

  const handleLatestContentChange = (newContent: string) => {
    if (lastGeneratedSection && lastGeneratedSubsection) {
      const componentKey = `${lastGeneratedSection}:${lastGeneratedSubsection}`;
      handleContentChange(
        lastGeneratedSection,
        lastGeneratedSubsection,
        newContent
      );
    }
    setGeneratedContent(newContent);
  };

  const handleCorrectionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setUserCorrection(e.target.value);
  };

  const handleRegenerateInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setRegenerateInput(e.target.value);
  };

  const toggleSectionExpanded = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Generate on Ctrl+Enter or Cmd+Enter, but only if we're not at the end of the sequence
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isLoading && !isGenerationComplete()) {
          handleGenerate();
        }
      }
    };

    // Add event listener to the document
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleGenerate, isLoading, isGenerationComplete]);

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
        duration: 3000,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        duration: 5000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate progress for the progress bar
  const calculateProgress = useCallback(() => {
    // Count total sections
    const totalSections = MAIN_SECTIONS.length;

    // Count completed sections
    const completedSections = new Set(
      Object.keys(editedComponents).map((key) => key.split(":")[0])
    ).size;

    // Calculate percentage
    return Math.round((completedSections / totalSections) * 100);
  }, [editedComponents]);

  // Render the sections and their generated subsections
  const renderSections = () => {
    // Track which sections have been seen in the generation sequence
    const sectionsToRender = new Set<string>();

    // Add the current section and any previous sections
    for (let i = 0; i <= currentSectionIndex; i++) {
      sectionsToRender.add(MAIN_SECTIONS[i]);
    }

    // Also add any section that has generated content
    Object.keys(editedComponents).forEach((key) => {
      const [section] = key.split(":");
      sectionsToRender.add(section);
    });

    return MAIN_SECTIONS.filter((section) => sectionsToRender.has(section))
      .map((section) => {
        const componentKey = `${section}:${section}`;
        const hasContent = componentKey in editedComponents;

        // Only show sections that have content or are the current section being worked on
        const isCurrentSection = section === currentSection;

        if (!hasContent && !isCurrentSection) {
          return null;
        }

        return (
          <div key={section} className="mb-8">
            <div
              className="flex items-center cursor-pointer bg-blue-50 p-3 rounded-md mb-4"
              onClick={() => toggleSectionExpanded(section)}
            >
              {expandedSections[section] ? (
                <ChevronDown className="h-5 w-5 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 mr-2" />
              )}
              {/* Removed section number, showing just the section name */}
              <h3 className="text-xl font-semibold">{section}</h3>
            </div>

            {expandedSections[section] && (
              <div className="space-y-6">
                {hasContent ? (
                  <div
                    ref={
                      section === lastGeneratedSection
                        ? latestGeneratedRef
                        : null
                    }
                  >
                    <ResizableSection
                      key={componentKey}
                      title={section}
                      content={editedComponents[componentKey]}
                      metadata={
                        sectionMetadata[componentKey] || {
                          type: section,
                          timestamp: Date.now(),
                        }
                      }
                      onContentChange={(newContent) =>
                        handleContentChange(section, section, newContent)
                      }
                      onEdit={() => {
                        setGeneratedContent(editedComponents[componentKey]);
                        setLastGeneratedSection(section);
                        setLastGeneratedSubsection(section);
                        setCorrectionModalOpen(true);
                      }}
                      onRegenerate={() => {
                        setGeneratedContent(editedComponents[componentKey]);
                        setLastGeneratedSection(section);
                        setLastGeneratedSubsection(section);
                        setRegenerateModalOpen(true);
                      }}
                    />
                  </div>
                ) : isCurrentSection ? (
                  // Show a placeholder for the next section to be generated
                  <div className="flex items-center text-gray-500 py-2">
                    <span className="mr-2">•</span>
                    <span>{section}</span>
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Next to Generate
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })
      .filter(Boolean); // Filter out any null elements
  };

  return (
    <div className="flex h-screen w-full">
      {showSplitScreen && (
        <aside
          className={`relative bg-muted/30 border-r z-20 transition-all duration-300 ease-in-out ${
            sourcesPanelCollapsed ? "w-12" : "w-1/3 max-w-lg"
          } hidden lg:flex flex-col flex-shrink-0 h-full`}
        >
          {/* Collapse/Expand Button */}
          <div className="absolute top-4 right-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSourcesPanelCollapsed(!sourcesPanelCollapsed)}
              className="h-8 w-8"
              aria-label={
                sourcesPanelCollapsed
                  ? "Expand sources panel"
                  : "Collapse sources panel"
              }
            >
              {sourcesPanelCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!sourcesPanelCollapsed && (
            <>
              <div className="border-b p-4 flex items-center justify-between bg-muted/50 flex-shrink-0">
                <h2 className="text-lg font-semibold">
                  Data: {splitScreenContent.title}
                </h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4" ref={scrollRef}>
                  {Object.entries(rawData).map(([section, content]) => (
                    <div
                      key={section}
                      id={`section-${section.toLowerCase()}`}
                      className="rounded-2xl border border-p200 bg-white shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-n900 capitalize">
                            {section === "keyterms" ? "Key Terms" : section}
                          </h3>
                          <p className="text-xs text-n900 opacity-70">
                            Section: {section}
                          </p>
                        </div>
                      </div>

                      <pre className="text-sm text-n900 whitespace-pre-wrap leading-relaxed font-mono border-t border-dashed pt-4 mt-4">
                        {content}
                      </pre>
                    </div>
                  ))}
                </div>

                <div className="p-4 space-y-4">
                  {embodimentPages.length > 1 &&
                    embodimentPages.map((page: any, id: number) => (
                      <div
                        key={id}
                        id={`section-${page.section.toLowerCase()}_page_number-${
                          page.page_number
                        }`}
                        className="rounded-2xl border border-p200 bg-white shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h2 className="text-lg font-semibold text-n900 capitalize">
                              {page.section}
                            </h2>
                            <p className="text-xs text-n900 opacity-70">
                              Page {page.page_number} – {page.filename}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-n900 whitespace-pre-wrap leading-relaxed font-mono border-t border-dashed pt-4 mt-4">
                          {page.text}
                        </p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </>
          )}
        </aside>
      )}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out px-4 ${
          showSplitScreen
            ? sourcesPanelCollapsed
              ? "lg:w-[calc(100%-3rem)]"
              : "lg:w-[calc(100%-33.3333%)]"
            : "w-full"
        }`}
        style={{
          width: showSplitScreen
            ? sourcesPanelCollapsed
              ? "calc(100% - 3rem)"
              : "calc(100% - 33.3333%)"
            : "100%",
        }}
      >
        <Card className="border rounded-lg">
          <CardContent
            className="relative max-h-[80vh] overflow-y-auto pt-6"
            ref={contentRef}
          >
            <div className="flex-1">
              <StoredKnowledge stage={stage} setStage={setStage} />
              <div className="mt-10">
                <h2
                  className="text-2xl font-bold"
                  onClick={() => {
                    console.log("Le", rawData);
                  }}
                >
                  Patent Section Generator
                </h2>
                <p className="text-gray-500">
                  Generate patent sections sequentially with AI assistance
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {error && (
                <Alert
                  variant={
                    error.includes("successfully") ? "default" : "destructive"
                  }
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Regenerate Dialog */}
              <Dialog
                open={regenerateModalOpen}
                onOpenChange={setRegenerateModalOpen}
              >
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Regenerate {lastGeneratedSection}</DialogTitle>
                    <DialogDescription>
                      Provide specific guidance to steer the AI in generating a
                      new version of this section.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <textarea
                      ref={regenerateRef}
                      defaultValue={regenerateInput}
                      onChange={handleRegenerateInputChange}
                      placeholder="Enter specific instructions for regeneration (e.g., 'Make it more technical', 'Focus more on the advantages', 'Simplify the language')..."
                      className="w-full min-h-[200px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRegenerateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegenerateWithCorrections}
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={isLoading}
                    >
                      {isLoading ? "Regenerating..." : "Submit & Regenerate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Render all sections */}
              {renderSections()}

              {/* Hidden reference for scrolling to the latest generated content */}
              <div ref={latestGeneratedRef} className="h-0 w-0" />

              {/* Feedback Dialog */}
              <Dialog
                open={correctionModalOpen}
                onOpenChange={setCorrectionModalOpen}
              >
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      Provide Feedback for {lastGeneratedSection}
                    </DialogTitle>
                    <DialogDescription>
                      Please provide specific feedback or corrections to improve
                      the generated content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <textarea
                      ref={correctionRef}
                      defaultValue={userCorrection}
                      onChange={handleCorrectionChange}
                      placeholder="Enter your specific feedback or corrections here..."
                      className="w-full min-h-[200px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCorrectionModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        // Ensure we have the latest value from the textarea
                        const text = correctionRef.current?.value || "";

                        // Update the state with the latest value
                        setUserCorrection(text);

                        // Close the dialog
                        setCorrectionModalOpen(false);

                        // Show success toast
                        toast({
                          title: "Success",
                          description: "Feedback saved successfully!",
                          duration: 3000,
                        });
                      }}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Submit Feedback
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Bottom Button - Either Generate or Generate PDF */}
              <div className="mt-8 flex justify-start">
                {isGenerationComplete() ? (
                  // Show Generate PDF button when generation is complete
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg relative"
                  >
                    {isGeneratingPDF ? (
                      <div className="flex items-center">
                        <div className="mr-2 flex">
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                        Generating PDF...
                      </div>
                    ) : (
                      <>
                        <FileDown className="h-5 w-5 mr-2" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                ) : (
                  // Show Generate button when there are still sections to generate
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg relative"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="mr-2 flex">
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="animate-bounce inline-block mx-0.5 h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </div>
                        Generating...
                      </div>
                    ) : (
                      <>
                        Generate {currentSection}
                        <span className="ml-2 opacity-70 text-sm">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default PatentComponentGenerator;
