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
import { Save, FileDown, ChevronDown, ChevronRight } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "./ui/use-toast";

interface PatentComponentGeneratorProps {
  patentContext: string;
  onComponentGenerated: (component: string) => void;
  generatedComponents: string[];
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
const MAIN_SECTIONS = [
  "Definitions and methodology",
  "Disease Background & Relevance",
  "Technology or Product Overview",
];

// Define the subsections for each main section (these will be generated)
const SUBSECTIONS: Record<string, string[]> = {
  "Definitions and methodology": ["Key terms"],
  "Disease Background & Relevance": ["Disease Overview", "Target overview"],
  "Technology or Product Overview": [
    "High-Level Concept",
    "Underlying Mechanism",
  ],
  "Embodiments (Core of the Detailed Description)": [
    "Composition",
    "Manufacturing Processes",
    "Administration Methods",
    "Indications & Patient Populations",
    "Additional Modalities",
  ],
};

const STORAGE_KEY = "patent_generator_progress";

const PatentComponentGenerator: React.FC<PatentComponentGeneratorProps> = ({
  patentContext,
  onComponentGenerated,
  generatedComponents,
}) => {
  const { toast } = useToast();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const currentSection = MAIN_SECTIONS[currentSectionIndex];
  const currentSubsections = SUBSECTIONS[currentSection];
  const currentSubsection = currentSubsections?.[currentSubsectionIndex];

  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [userCorrection, setUserCorrection] = useState("");
  const [regenerateInput, setRegenerateInput] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const latestGeneratedRef = useRef<HTMLDivElement>(null);
  const correctionRef = useRef<HTMLTextAreaElement>(null);
  const regenerateRef = useRef<HTMLTextAreaElement>(null);
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
    // For the first section (Key Terms), don't try to scroll to the duplicate content
    // since it won't be rendered
    const isFirstSection =
      lastGeneratedSection === "Definitions and methodology" &&
      lastGeneratedSubsection === "Key terms";

    if (generatedContent && latestGeneratedRef.current && !isFirstSection) {
      setTimeout(() => {
        latestGeneratedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else if (generatedContent && isFirstSection) {
      // For the first section, scroll to the bottom to see the Generate button
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [generatedContent, lastGeneratedSection, lastGeneratedSubsection]);

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

  const handleGenerate = useCallback(async () => {
    if (typeof window !== "undefined" && window.setIsLoading) {
      window.setIsLoading(true);
    }
    setIsLoading(true);
    setError(null);

    // Store the current section and subsection before generating
    const sectionToGenerate = currentSection;
    const subsectionToGenerate = currentSubsection;
    setLastGeneratedSection(sectionToGenerate);
    setLastGeneratedSubsection(subsectionToGenerate);

    if (typeof window !== "undefined" && window.setLastGeneratedSection) {
      window.setLastGeneratedSection(sectionToGenerate);
    }
    if (typeof window !== "undefined" && window.setLastGeneratedSubSection) {
      window.setLastGeneratedSubSection(subsectionToGenerate);
    }

    try {
      // Create a prompt that includes the context of the section and subsection
      const enhancedContext = `${patentContext}

Please generate the "${subsectionToGenerate}" subsection for the "${sectionToGenerate}" section of the patent.
This subsection should be detailed, technically accurate, and formatted appropriately for a patent document.`;

      const content = await generatePatentContent(
        subsectionToGenerate,
        enhancedContext
      );
      setGeneratedContent(content);

      // Create a unique key for this section/subsection
      const componentKey = `${sectionToGenerate}:${subsectionToGenerate}`;

      // Create metadata for the new section
      const newMetadata: SectionMetadata = {
        type: `${sectionToGenerate} - ${subsectionToGenerate}`,
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

      // Move to next subsection or section
      moveToNextSubsection();

      // Show success toast
      toast({
        title: "Success",
        description: `${subsectionToGenerate} subsection generated successfully!`,
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
    const currentSubsections = SUBSECTIONS[currentSection];

    if (currentSubsectionIndex < currentSubsections.length - 1) {
      // Move to the next subsection in the current section
      setCurrentSubsectionIndex(currentSubsectionIndex + 1);
    } else if (currentSectionIndex < MAIN_SECTIONS.length - 1) {
      // Move to the first subsection of the next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentSubsectionIndex(0);
    } else {
      // We've reached the end of all sections and subsections
      // Set the index beyond the last subsection to trigger the "Generate PDF" button
      setCurrentSubsectionIndex(currentSubsections.length);
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
      // Use the last generated section and subsection for regeneration
      const sectionToRegenerate = lastGeneratedSection || MAIN_SECTIONS[0];
      const subsectionToRegenerate =
        lastGeneratedSubsection || SUBSECTIONS[MAIN_SECTIONS[0]][0];

      // Create a unique key for this section/subsection
      const componentKey = `${sectionToRegenerate}:${subsectionToRegenerate}`;

      // Get the current content of the section we're regenerating
      const currentSectionContent =
        editedComponents[componentKey] || generatedContent;

      const correctedPrompt = `${patentContext}

Previous content: ${currentSectionContent}

User guidance: ${correctionText}

Please regenerate the "${subsectionToRegenerate}" subsection for the "${sectionToRegenerate}" section based on this guidance.
This subsection should be detailed, technically accurate, and formatted appropriately for a patent document.`;

      const regeneratedText = await generatePatentContent(
        subsectionToRegenerate,
        correctedPrompt
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
          type: `${sectionToRegenerate} - ${subsectionToRegenerate}`,
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
        description: `${subsectionToRegenerate} subsection successfully regenerated!`,
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
        type: `${sectionType} - ${subsectionType}`,
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
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate progress for the progress bar
  const calculateProgress = useCallback(() => {
    // Count total subsections across all sections
    const totalSubsections = MAIN_SECTIONS.reduce((total, section) => {
      return total + SUBSECTIONS[section].length;
    }, 0);

    // Count completed subsections
    const completedSubsections = Object.keys(editedComponents).length;

    // Calculate percentage
    return Math.round((completedSubsections / totalSubsections) * 100);
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
      .map((section, index) => {
        const subsections = SUBSECTIONS[section];
        const sectionNumber = MAIN_SECTIONS.indexOf(section) + 1;

        // Track which subsections have content or are next to be generated
        const hasAnyContent = subsections.some((subsection) => {
          const componentKey = `${section}:${subsection}`;
          return componentKey in editedComponents;
        });

        // Only show sections that have content or are the current section being worked on
        const isCurrentSection = section === currentSection;

        if (!hasAnyContent && !isCurrentSection) {
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
              <h3 className="text-xl font-semibold">
                {sectionNumber}. {section}
              </h3>
            </div>

            {expandedSections[section] && (
              <div className="pl-8 space-y-6">
                {subsections.map((subsection) => {
                  const componentKey = `${section}:${subsection}`;
                  const hasContent = componentKey in editedComponents;

                  // Only show subsections that have been generated
                  // or the next one to be generated if this is the current section
                  const isNextSubsection =
                    isCurrentSection && subsection === currentSubsection;

                  if (!hasContent && !isNextSubsection) {
                    return null;
                  }

                  if (hasContent) {
                    return (
                      <ResizableSection
                        key={componentKey}
                        title={subsection}
                        content={editedComponents[componentKey]}
                        metadata={
                          sectionMetadata[componentKey] || {
                            type: `${section} - ${subsection}`,
                            timestamp: Date.now(),
                          }
                        }
                        onContentChange={(newContent) =>
                          handleContentChange(section, subsection, newContent)
                        }
                        onEdit={() => {
                          setGeneratedContent(editedComponents[componentKey]);
                          setLastGeneratedSection(section);
                          setLastGeneratedSubsection(subsection);
                          setCorrectionModalOpen(true);
                        }}
                        onRegenerate={() => {
                          setGeneratedContent(editedComponents[componentKey]);
                          setLastGeneratedSection(section);
                          setLastGeneratedSubsection(subsection);
                          setRegenerateModalOpen(true);
                        }}
                      />
                    );
                  } else if (isNextSubsection) {
                    // Show a placeholder for the next subsection to be generated
                    return (
                      <div
                        key={componentKey}
                        className="flex items-center text-gray-500 py-2"
                      >
                        <span className="mr-2">•</span>
                        <span>{subsection}</span>
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          Next to Generate
                        </span>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })
      .filter(Boolean); // Filter out any null elements
  };

  return (
    <>
      <div className="mb-6">
        {/* Navigation bar */}
        {/* <div className="flex justify-between items-center mb-4"> */}
        {/* <div>
            <StoredKnowledge />
          </div> */}
        {/* <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={saveProgress}
              className="flex items-center gap-1"
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
                  <Save className="h-4 w-4 mr-1" />
                  Save Progress
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGeneratePDF()}
              className="flex items-center gap-1"
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
                  <FileDown className="h-4 w-4 mr-1" />
                  Generate PDF
                </>
              )}
            </Button>
          </div> */}
        {/* </div> */}

        {/* Header text */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold">Patent Section Generator</h2>
          <p className="text-gray-500">
            Generate patent sections sequentially with AI assistance
          </p>
        </div>
      </div>

      <Card className="border rounded-lg">
        <CardContent
          className="relative max-h-[80vh] overflow-y-auto pt-6"
          ref={contentRef}
        >
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
                  <DialogTitle>
                    Regenerate {lastGeneratedSubsection}
                    {lastGeneratedSection && ` (${lastGeneratedSection})`}
                  </DialogTitle>
                  <DialogDescription>
                    Provide specific guidance to steer the AI in generating a
                    new version of this subsection.
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

            {/* Render all sections with their subsections */}
            {renderSections()}

            {/* Latest Generated Content - Using ResizableSection */}
            {generatedContent &&
              lastGeneratedSection &&
              lastGeneratedSubsection &&
              // Only show the duplicate content box if it's NOT the first section (Key Terms)
              !(
                lastGeneratedSection === "Definitions and methodology" &&
                lastGeneratedSubsection === "Key terms"
              ) && (
                <div ref={latestGeneratedRef} className="mt-4">
                  <ResizableSection
                    title={`${lastGeneratedSubsection} (${lastGeneratedSection})`}
                    content={generatedContent}
                    metadata={{
                      type: `${lastGeneratedSection} - ${lastGeneratedSubsection}`,
                      timestamp: Date.now(),
                      regenerationCount: 0,
                    }}
                    onContentChange={handleLatestContentChange}
                    onEdit={() => {
                      // Open the correction modal
                      setCorrectionModalOpen(true);
                    }}
                    onRegenerate={() => {
                      // Open the regenerate modal
                      setRegenerateModalOpen(true);
                    }}
                  />
                </div>
              )}

            {/* Feedback Dialog */}
            <Dialog
              open={correctionModalOpen}
              onOpenChange={setCorrectionModalOpen}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    Provide Feedback for {lastGeneratedSubsection}
                    {lastGeneratedSection && ` (${lastGeneratedSection})`}
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
                      Generate {currentSubsection}
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

      {/* Toast notifications */}
      <Toaster />
    </>
  );
};

export default PatentComponentGenerator;
