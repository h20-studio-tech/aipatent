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

interface ParsedContent {
  content: string;
  footnotes: FootnoteReference[];
}

interface FootnoteReference {
  id: string;
  type: 'disease' | 'antigen' | 'approach' | 'technology' | 'innovation' | 'additional';
  text: string;
  position: number;
  endPosition: number;
}

interface MetadataSection {
  type: 'disease' | 'antigen' | 'approach' | 'technology' | 'innovation' | 'additional';
  content: string;
  citations: number[];
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

const BACKGROUND_MOCK = `
COVID-19, caused by the SARS-CoV-2 virus, represents a persistent and significant global health crisis, leading to widespread morbidity, mortality, and substantial economic disruption worldwide. The rapid and unpredictable emergence of new variants continues to pose a formidable challenge to public health, necessitating the development of highly effective and adaptable prophylactic and therapeutic interventions. [disease] Current strategies to combat COVID-19 primarily involve vaccination, with many successful vaccines targeting the SARS-CoV-2 spike protein, particularly its receptor-binding domain (RBD). This region is critical for viral entry into host cells and is a primary target for neutralizing antibodies. [antigen] Despite the success of existing vaccines, significant unmet needs persist, particularly concerning scalability, cost-effectiveness, and clinical adaptability. Many current manufacturing processes face bottlenecks, and the logistical demands, such as stringent cold chain requirements, limit global accessibility, especially in resource-constrained settings. [additional] Furthermore, the continuous evolution of SARS-CoV-2 has led to the emergence of numerous variants with mutations in the spike protein, which can reduce the efficacy of existing vaccines and antibody-based treatments. This necessitates frequent updates to vaccine formulations and a more agile response mechanism to maintain broad-spectrum protection against circulating and emerging strains. [antigen] There is a critical need for next-generation solutions that can overcome these limitations by providing enhanced immunogenicity, improved stability, and the capacity for rapid adaptation to new viral threats. Such solutions must offer a robust and broadly protective immune response while simplifying manufacturing and distribution. [approach] The present invention addresses these challenges through a novel approach utilizing a nanoparticle-based delivery platform. This platform is designed to display multiple copies of the SARS-CoV-2 spike protein receptor-binding domain (RBD) and its engineered variants in a highly ordered structure, thereby enhancing immunogenicity and stability. The technology leverages self-assembling protein nanoparticles combined with mRNA encoding the antigen, further supported by lipid-based adjuvants to boost the immune response. [approach] [technology] Crucially, this system introduces a modular plug-and-play design, allowing for the rapid adaptation of the nanoparticle scaffold to emerging viral variants. This innovative design provides the potential for broad-spectrum protection with fewer manufacturing bottlenecks, offering a significant improvement in the ability to respond to future pandemic threats. [innovation]
`;

// Function to parse content with footnotes
const parseContentWithFootnotes = (rawContent: string): ParsedContent => {
  const footnotePattern = /\[(disease|antigen|approach|technology|innovation|additional)\]/g;
  const footnotes: FootnoteReference[] = [];
  let processedContent = rawContent;
  let match;
  let footnoteCounter = 1;

  // Store all matches first
  const matches: Array<{ type: string; index: number; length: number }> = [];
  while ((match = footnotePattern.exec(rawContent)) !== null) {
    matches.push({
      type: match[1],
      index: match.index,
      length: match[0].length
    });
  }

  // Process matches in reverse order to maintain correct positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const { type, index, length } = matches[i];
    const footnoteId = `fn-${footnoteCounter}`;

    // Get the surrounding text for context (50 chars before and after)
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(rawContent.length, index + length + 50);
    const contextText = rawContent.substring(contextStart, contextEnd).replace(/\[.*?\]/g, '').trim();

    footnotes.unshift({
      id: footnoteId,
      type: type as any,
      text: contextText,
      position: index,
      endPosition: index + length
    });

    // Keep the original tag but wrap it in a span for styling
    const replacement = `<span class="footnote-ref" data-footnote-id="${footnoteId}" data-footnote-type="${type}" style="color: #2563eb; cursor: pointer; font-weight: 600;">[${type}]</span>`;
    processedContent = processedContent.substring(0, index) + replacement + processedContent.substring(index + length);
    footnoteCounter++;
  }

  return {
    content: processedContent,
    footnotes: footnotes.reverse()
  };
};

// Function to extract metadata from stored knowledge
const extractMetadataFromKnowledge = (
  innovation: string,
  approach: string,
  technology: string,
  disease: string,
  antigen: string,
  additional: string,
  footnotes: FootnoteReference[]
): MetadataSection[] => {
  const metadata: MetadataSection[] = [];

  const typeToContent: Record<string, string> = {
    innovation,
    approach,
    technology,
    disease,
    antigen,
    additional
  };

  // Create metadata sections without citation counts
  Object.entries(typeToContent).forEach(([type, content]) => {
    metadata.push({
      type: type as any,
      content: content || `Content for ${type}`,
      citations: [] // Empty citations array - we don't need to show numbers
    });
  });

  return metadata;
};

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
  const [parsedSections, setParsedSections] = useState<
    Record<string, ParsedContent>
  >({});
  const [activeFootnote, setActiveFootnote] = useState<string | null>(null);
  const [sectionMetadataDisplay, setSectionMetadataDisplay] = useState<
    Record<string, MetadataSection[]>
  >({});
  const [storedKnowledgeData, setStoredKnowledgeData] = useState<{
    approachKnowledge: { answer: string };
    innovationKnowledge: { answer: string };
    technologyKnowledge: { answer: string };
    notesKnowledge: { answer: string };
  }>({
    approachKnowledge: { answer: "" },
    innovationKnowledge: { answer: "" },
    technologyKnowledge: { answer: "" },
    notesKnowledge: { answer: "" },
  });

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

  // Add click handler for footnotes
  useEffect(() => {
    const handleFootnoteClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('footnote-ref')) {
        const footnoteType = target.getAttribute('data-footnote-type');
        const footnoteId = target.getAttribute('data-footnote-id');

        if (footnoteType && footnoteId) {
          // Set active footnote
          setActiveFootnote(footnoteId);

          // Find the correct metadata element - now we have single cards for each type
          const metadataElement = document.getElementById(`metadata-${footnoteType}`);

          if (metadataElement) {
            metadataElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // Add highlight animation
            metadataElement.classList.add('ring-2', 'ring-blue-500', 'border-blue-500');
            setTimeout(() => {
              metadataElement.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
              setActiveFootnote(null);
            }, 3000);
          }
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleFootnoteClick);

    return () => {
      document.removeEventListener('click', handleFootnoteClick);
    };
  }, []);

  const fetchStoredKnowledge = async () => {
    try {
      const approachResponse = await axios.get(
        `${backendUrl}/v1/knowledge/approach/${patentId}`
      );
      const innovationResponse = await axios.get(
        `${backendUrl}/v1/knowledge/innovation/${patentId}`
      );
      const technologyResponse = await axios.get(
        `${backendUrl}/v1/knowledge/technology/${patentId}`
      );
      const notesResponse = await axios.get(
        `${backendUrl}/v1/knowledge/research-note/${patentId}`
      );

      // Prepare the knowledge data to return
      let approachKnowledge = "";
      let innovationKnowledge = "";
      let technologyKnowledge = "";
      let notesKnowledge = "";

      if (typeof window !== "undefined" && window.addStoredData) {
        if (approachResponse.data.data.length > 0) {
          // Combine all approach answers
          const approachAnswers = [];
          for (const approachItem of approachResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: approachItem.question,
              answer: approachItem.answer,
              section: "Approach",
              timestamp: approachItem.created_at,
            };
            window.addStoredData("knowledge", newNote);
            approachAnswers.push(approachItem.answer);
          }
          approachKnowledge = approachAnswers.join(" ");
        }

        if (innovationResponse.data.data.length > 0) {
          // Combine all innovation answers
          const innovationAnswers = [];
          for (const innovationItem of innovationResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: innovationItem.question,
              answer: innovationItem.answer,
              section: "Innovation",
              timestamp: innovationItem.created_at,
            };
            window.addStoredData("knowledge", newNote);
            innovationAnswers.push(innovationItem.answer);
          }
          innovationKnowledge = innovationAnswers.join(" ");
        }

        if (technologyResponse.data.data.length > 0) {
          // Combine all technology answers
          const technologyAnswers = [];
          for (const technologyItem of technologyResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: technologyItem.question,
              answer: technologyItem.answer,
              section: "Technology",
              timestamp: technologyItem.created_at,
            };
            window.addStoredData("knowledge", newNote);
            technologyAnswers.push(technologyItem.answer);
          }
          technologyKnowledge = technologyAnswers.join(" ");
        }

        if (notesResponse.data.data.length > 0) {
          console.log("A");
          const notesAnswers = [];
          for (const notes of notesResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: "Research Note",
              answer: notes.content,
              section: "Note",
              timestamp: notes.created_at,
            };
            console.log("B", newNote);
            window.addStoredData("note", newNote);
            notesAnswers.push(notes.content);
          }
          notesKnowledge = notesAnswers.join(" ");
        }
      }

      // Return the collected knowledge data
      return {
        approachKnowledge: { answer: approachKnowledge },
        innovationKnowledge: { answer: innovationKnowledge },
        technologyKnowledge: { answer: technologyKnowledge },
        notesKnowledge: { answer: notesKnowledge }
      };
    } catch (err) {
      console.log(err);
      // Return empty knowledge if there's an error
      return {
        approachKnowledge: { answer: "" },
        innovationKnowledge: { answer: "" },
        technologyKnowledge: { answer: "" },
        notesKnowledge: { answer: "" }
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
      fetchStoredKnowledge().then((knowledge) => {
        if (knowledge) {
          setStoredKnowledgeData(knowledge);
        }
      });
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
      // Use the already fetched stored knowledge from state
      const storedKnowledge = storedKnowledgeData;

      console.log("Stored", storedKnowledge);
      console.log("Antigen", antigen);
      console.log("Disease", disease);

      if (!antigen || !disease) {
        console.warn("Missing critical data:", { antigen, disease });
      }
      // Call the actual API - it now returns responses with tags
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
      // Parse the content for footnotes
      const parsed = parseContentWithFootnotes(content);
      setGeneratedContent(parsed.content);

      console.log("first", content);
      console.log("parsed", parsed);

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
        [componentKey]: parsed.content,
      }));

      // Store parsed sections
      setParsedSections((prev) => ({
        ...prev,
        [componentKey]: parsed
      }));

      // Extract and store metadata for display
      const metadata = extractMetadataFromKnowledge(
        storedKnowledge?.innovationKnowledge?.answer || "Innovation details not available",
        storedKnowledge?.approachKnowledge?.answer || "Approach details not available",
        storedKnowledge?.technologyKnowledge?.answer || "Technology details not available",
        disease || "Disease information not available",
        antigen || "Antigen information not available",
        "Additional context and requirements",
        parsed.footnotes
      );

      setSectionMetadataDisplay((prev) => ({
        ...prev,
        [componentKey]: metadata
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
  }, [currentSection, currentSubsection, patentContext, toast, storedKnowledgeData, antigen, disease]);

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

      // Use the already fetched stored knowledge from state
      const storedKnowledge = storedKnowledgeData;

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
                  <h3 className="text-sm font-bold text-gray-800 mb-3">
                    Source Data
                  </h3>

                  {/* Single metadata card showing all the input variables */}
                  <div className="space-y-3">
                    {/* Innovation */}
                    <div
                      id="metadata-innovation"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('innovation')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Innovation</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {storedKnowledgeData.innovationKnowledge.answer || 'Innovation data will appear here when knowledge is created'}
                      </div>
                    </div>

                    {/* Approach */}
                    <div
                      id="metadata-approach"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('approach')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Approach</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {storedKnowledgeData.approachKnowledge.answer || 'Approach data will appear here when knowledge is created'}
                      </div>
                    </div>

                    {/* Technology */}
                    <div
                      id="metadata-technology"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('technology')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Technology</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {storedKnowledgeData.technologyKnowledge.answer || 'Technology data will appear here when knowledge is created'}
                      </div>
                    </div>

                    {/* Disease */}
                    <div
                      id="metadata-disease"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('disease')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Disease</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {disease || 'Disease information not provided'}
                      </div>
                    </div>

                    {/* Antigen */}
                    <div
                      id="metadata-antigen"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('antigen')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Antigen</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {antigen || 'Antigen information not provided'}
                      </div>
                    </div>

                    {/* Additional */}
                    <div
                      id="metadata-additional"
                      className={`rounded-lg border bg-white transition-all duration-300 p-4 ${
                        activeFootnote && activeFootnote.includes('additional')
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Additional Input</h4>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {storedKnowledgeData.notesKnowledge.answer || 'Research notes will appear here when created'}
                      </div>
                    </div>
                  </div>
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
