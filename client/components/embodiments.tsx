"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  File,
  Library,
  CheckCircle,
  Lightbulb,
  Save,
  Edit2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileUp,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { mockPdfs } from "@/lib/mock-data";
import { backendUrl } from "@/config/config";
import axios from "axios";
import { PDF } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "./ui/textarea";
import StoredKnowledge from "./stored-knowledge";
import ProcessingLoader from "./processingLoader";
import ProcessCompleteLoader from "./processCompleteLoader";

// Interface for embodiment objects
interface Embodiment {
  id: number;
  title: string;
  description: string;
  selected: boolean;
  confidence?: number;
  source?: string;
  pageNumber?: number; // ✅ Add this
  section?: string; // ✅ And this
  summary?: string;
  header?: string;
  headingSummary?: string;
  category?: string;
}

// Interface for remixed embodiment objects
interface RemixedEmbodiment {
  id: number;
  originalId: number;
  title: string;
  description: string;
  similarityPercentage: number;
  createdAt: string;
}

interface RawData {
  abstract?: string;
  keyterms?: string;
  summary?: string;
  description?: string;
  claims?: string;
  [key: string]: string | undefined; // To support dynamic keys like `description_header_*`
}

// Interface for stored knowledge objects
interface StoredKnowledge {
  id: number;
  title: string;
  description: string;
  source: string;
  section: string;
  savedAt: string;
}

// Interface for PDF files
interface PdfFile {
  id: string;
  name: string;
  selected: boolean;
  size?: string;
  uploadDate?: string;
}

type RawChunk = {
  filename: string;
  page_number: number;
  section: string;
  text: string;
  summary?: string;
  header?: string;
};

type EmbodimentMap = {
  summary: Embodiment[];
  description: Embodiment[];
  claims: Embodiment[];
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export function transformGroupedEmbodiments(response: any): EmbodimentMap {
  let idCounter = 1;

  const map: EmbodimentMap = {
    summary: [],
    description: [],
    claims: [],
  };

  const getSectionKey = (section: string) => {
    if (section.toLowerCase().includes("summary")) return "summary";
    if (section.toLowerCase().includes("description")) return "description";
    return null;
  };

  for (const sec of response.sections || []) {
    const key = getSectionKey(sec.section);
    if (!key) continue;

    for (const sub of sec.subsections || []) {
      const hasEmbodiments =
        Array.isArray(sub.embodiments) && sub.embodiments.length > 0;

      // If there are actual embodiments, process them
      if (hasEmbodiments) {
        for (const emb of sub.embodiments) {
          map[key].push({
            id: idCounter++,
            title: `Embodiment #${idCounter - 1}`,
            description: emb.text || "",
            summary: emb.summary,
            selected: true,
            confidence: parseFloat((0.87 + Math.random() * 0.1).toFixed(2)),
            source: emb.filename || "Uploaded PDF",
            headingSummary: sub.summary,
            header: sub.header ? sub.header : "",
            category: emb.sub_category ? emb.sub_category : "",
          });
        }
      } else {
        // Push a placeholder to preserve header/summary with no embodiments
        map[key].push({
          id: idCounter++,
          title: `Embodiment #${idCounter - 1}`,
          description: "", // Empty content
          selected: false,
          confidence: undefined,
          source: "Uploaded PDF",
          section: sec.section,
          headingSummary: sub.summary,
          header: sub.header,
          category: "product composition",
        });
      }
    }
  }

  for (const chunk of response.data || []) {
    const section = chunk.section?.toLowerCase();
    if (!section?.includes("claim")) continue;

    map.claims.push({
      id: idCounter++,
      title: `Embodiment #${idCounter - 1}`,
      description: chunk.text?.trim() || "",
      selected: true,
      confidence: parseFloat((0.87 + Math.random() * 0.1).toFixed(2)),
      source: response.filename,
      pageNumber: chunk.page_number,
      section: chunk.section,
      summary: chunk.summary || "",
    });
  }

  return map;
}

export function transformApiEmbodiments(data: RawChunk[]): EmbodimentMap {
  let idCounter = 1;

  const map: EmbodimentMap = {
    summary: [],
    description: [],
    claims: [],
  };

  for (const chunk of data) {
    const key = chunk.section.toLowerCase().includes("summary")
      ? "summary"
      : chunk.section.toLowerCase().includes("description")
      ? "description"
      : chunk.section.toLowerCase().includes("claims")
      ? "claims"
      : null;

    if (!key) continue;

    map[key].push({
      id: idCounter++,
      title: `Embodiment #${idCounter - 1}`,
      description: chunk.text.trim(),
      selected: true,
      confidence: parseFloat((0.87 + Math.random() * 0.1).toFixed(2)),
      source: chunk.filename,
      pageNumber: chunk.page_number, // ✅
      section: chunk.section, // ✅
      summary: chunk.summary || "Lorem Ipsum dolor sit amet.",
      header: chunk.header,
    });
  }

  return map;
}
interface EmbodimentsProps {
  stage: number;
  setStage: (stage: number) => void;
}

export default function Embodiments({ stage, setStage }: EmbodimentsProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [keyTermsFromApi, setKeyTermsFromApi] = useState<
    { term: string; definition?: string; page_number?: number }[]
  >([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showResearchSections, setShowResearchSections] = useState(false);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedPatents, setSelectedPatents] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("abstract");
  const [showSummaryOfInvention, setShowSummaryOfInvention] = useState(true);
  const [showDetailedDescription, setShowDetailedDescription] = useState(true);
  const [rawDataContent, setRawDataContent] = useState({
    title: "",
    content: "",
  });
  const [showAbstract, setShowAbstract] = useState(true);
  const [showClaims, setShowClaims] = useState(true);
  const [abstract, setAbstract] = useState<string | "">("");
  const [visibleSummaries, setVisibleSummaries] = useState<
    Record<number, boolean>
  >({});
  const [rawData, setRawData] = useState<RawData>({
    keyterms: "",
    summary: "",
    description: "",
    claims: "",
  });
  const [showRawDataModal, setShowRawDataModal] = useState(false);

  const [tocCollapsed, setTocCollapsed] = useState(false);

  const [showSplitScreen, setShowSplitScreen] = useState<boolean>(false);
  const [sourcesPanelCollapsed, setSourcesPanelCollapsed] =
    useState<boolean>(false);
  const combinedRawData = Object.entries(rawData)
    .map(
      ([key, value]) =>
        `----------\n\n[ ${key
          .replace(/_/g, " ")
          .toUpperCase()} ]\n\n----------\n\n${value}`
    )
    .join("\n\n\n");
  const [splitScreenContent, setSplitScreenContent] = useState({
    title: "All Sources",
    content: "",
  });
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingFileName, setProcessingFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [embodiments, setEmbodiments] = useState<EmbodimentMap>({
    summary: [],
    description: [],
    claims: [],
  });

  const handleViewOriginal = (title: string, content: string) => {
    setSplitScreenContent({ title, content });
    if (!showSplitScreen) {
      setShowSplitScreen(true);
    }
    if (sourcesPanelCollapsed) {
      setSourcesPanelCollapsed(false);
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

  const [patentId, setPatentId] = useState<string>("");

  const toggleSummary = (embodimentId: number) => {
    setVisibleSummaries((prev) => ({
      ...prev,
      [embodimentId]: !prev[embodimentId],
    }));
  };

  const fetchRawContent = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/v1/raw-sections/${patentId}`
      );
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
      toast({
        title: "Error",
        description: "Error while fetching raw text.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (
    sectionKey: keyof typeof embodiments,
    selectStatus: boolean
  ) => {
    setEmbodiments((prev) => {
      const newEmbodiments = { ...prev };
      newEmbodiments[sectionKey] = newEmbodiments[sectionKey].map((emb) => ({
        ...emb,
        selected: selectStatus,
      }));
      return newEmbodiments;
    });
  };
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

      if (typeof window !== "undefined" && window.addStoredData) {
        if (approachResponse.data.data.length > 0) {
          for (const approachKnowledge of approachResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: approachKnowledge.question,
              answer: approachKnowledge.answer,
              section: "Approach",
              timestamp: approachKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (innovationResponse.data.data.length > 0) {
          for (const innovationKnowledge of innovationResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: innovationKnowledge.question,
              answer: innovationKnowledge.answer,
              section: "Innovation",
              timestamp: innovationKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (technologyResponse.data.data.length > 0) {
          for (const technologyKnowledge of technologyResponse.data.data) {
            const newNote = {
              patentId: patentId,
              question: technologyKnowledge.question,
              answer: technologyKnowledge.answer,
              section: "Technology",
              timestamp: technologyKnowledge.created_at,
            };
            window.addStoredData("knowledge", newNote);
          }
        }

        if (notesResponse.data.data.length > 0) {
          console.log("A");
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
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (patentId) {
      fetchStoredKnowledge();
    }
  }, [patentId]);

  useEffect(() => {
    if (embodiments && patentId) {
      fetchRawContent();
    }
  }, [embodiments, patentId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentId(params.get("patentId"));
    }
  }, []);

  const [openPopupId, setOpenPopupId] = useState<number | null>(null);
  const [remixedEmbodiments, setRemixedEmbodiments] = useState<
    RemixedEmbodiment[]
  >([]);
  const [isCreatingRemix, setIsCreatingRemix] = useState(false);
  const [storedKnowledge, setStoredKnowledge] = useState<StoredKnowledge[]>([]);
  const [showStoredKnowledge, setShowStoredKnowledge] = useState(false);
  const [editingEmbodimentId, setEditingEmbodimentId] = useState<number | null>(
    null
  );
  const [editingText, setEditingText] = useState("");
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new state for the edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmbodiment, setEditingEmbodiment] =
    useState<RemixedEmbodiment | null>(null);

  // Add these new state variables after the other state declarations
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [selectedMetadataEmbodiment, setSelectedMetadataEmbodiment] = useState<
    Embodiment | RemixedEmbodiment | null
  >(null);
  const [metadataType, setMetadataType] = useState<"extracted" | "remixed">(
    "extracted"
  );

  // Change the availablePdfs state to use IgY Patent related names
  const [availablePdfs, setAvailablePdfs] = useState<PDF[]>([]);

  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);
  const [patentName, setPatentName] = useState<string | null>(null);
  const [antigen, setAntigen] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [embodimentsForFileExist, setEmbodimentsForFileExist] =
    useState<boolean>(false);
  const confettiRef = useRef(null);
  const successIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentName(params.get("patentName"));
      setAntigen(params.get("antigen"));
      setDisease(params.get("disease"));
    }
  }, []);

  const handlePdfRemove = (pdfId: string) => {
    setSelectedPdfIds(selectedPdfIds.filter((id) => id !== pdfId));
  };

  const handlePdfSelect = (pdfId: string) => {
    setSelectedPdfIds((prev) => {
      const updatedIds = prev.includes(pdfId)
        ? prev.filter((id) => id !== pdfId) // Remove if already selected
        : [...prev, pdfId]; // Add if not selected
      return [...updatedIds]; // ✅ Ensure a new array is returned
    });
  };

  useEffect(() => {
    if (!showResearchSections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const sections = document.querySelectorAll("[data-section-id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [showResearchSections]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProcessingFileName(file.name);
      setIsProcessingPdf(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(
          `${backendUrl}/v1/documents/`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        const generatedId = response.data.id;
        const uploadedPDF: PDF = {
          id: generatedId,
          name: file.name,
          selected: true,
        };

        setAvailablePdfs((prev) => [
          uploadedPDF,
          ...prev.map((p) => ({ ...p, selected: false })),
        ]);
        setSelectedPdfIds([uploadedPDF.id]);
        setSelectedPatents([uploadedPDF.name]);
        setUploadedFile(file);
        setEmbodiments({ summary: [], description: [], claims: [] }); // reset
        setShowResearchSections(false);
        setCurrentStep("upload");
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsProcessingPdf(false);
        setProcessingComplete(true);
        setTimeout(() => setProcessingComplete(false), 3000);
      }
    }
  };

  const extractButtonDisabled =
    isExtracting ||
    (!uploadedFile &&
      embodiments.summary.length +
        embodiments.description.length +
        embodiments.claims.length >
        0);

  useEffect(() => {
    if (processingComplete) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000); // Confetti runs for 3s
    }
  }, [processingComplete]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${backendUrl}/v1/patent-files/`);
      const fetched = response.data.data || [];

      const formattedPdfs = fetched
        .filter((pdf: any) => pdf.name !== ".emptyFolderPlaceholder")
        .map((pdf: any) => ({
          id: pdf.id,
          name: pdf.filename || pdf.name,
          selected: false,
          size: pdf.size
            ? `${(pdf.size / (1024 * 1024)).toFixed(1)} MB`
            : undefined,
          uploadDate: pdf.uploaded_at?.split("T")[0],
        }));

      setAvailablePdfs(formattedPdfs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    const combinedRawData = Object.entries(rawData)
      .map(
        ([key, value]) =>
          `----------\n\n[ ${key
            .replace(/_/g, " ")
            .toUpperCase()} ]\n\n----------\n\n${value}`
      )
      .join("\n\n\n");

    setSplitScreenContent({
      title: "All Sources",
      content: combinedRawData,
    });
  }, [rawData]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // New state for filtering and sorting
  const [filterQuery, setFilterQuery] = useState("");
  const [pdfs, setPdfs] = useState(mockPdfs);
  const [sortOrder, setSortOrder] = useState<"name" | "date" | "size">("name");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "extract" | "review" | "create"
  >("upload");

  // Add a click handler to close the dropdown when clicking outside
  // Add this useEffect after the state declarations

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (pdfDropdownOpen && !target.closest(".pdf-dropdown")) {
        setPdfDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pdfDropdownOpen]);

  // Simulate extraction progress
  useEffect(() => {
    if (isExtracting) {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsExtracting(false);
            setShowResearchSections(true);
            setShowSplitScreen(true); // Show split screen after extraction
            setCurrentStep("review");
            return 0;
          }
          return prev + 5;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isExtracting]);

  const handleExtractEmbodiments = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Uploaded",
        description: "Please upload a PDF before extracting embodiments.",
        variant: "destructive",
      });
      return;
    }

    // 💥 Reset state FIRST to clear prior ones
    setEmbodiments({ summary: [], description: [], claims: [] });
    setShowResearchSections(false);

    setIsExtracting(true);
    setCurrentStep("extract");
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => (prev >= 90 ? 90 : prev + 1));
    }, 120);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await axios.post(
        `${backendUrl}/v1/patent/${patentId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = response.data.data;
      const mapped = transformGroupedEmbodiments(response.data || {});
      const keyTerms = response.data.terms?.definitions || null;
      const abst = response.data.abstract;
      setAbstract(abst);
      setSelectedPdfIds([response.data.file_id]);

      setKeyTermsFromApi(keyTerms);
      setEmbodiments(mapped);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      setTimeout(() => {
        setIsExtracting(false);
        setShowSplitScreen(true);
        setSourcesPanelCollapsed(false);
        setCurrentStep("review");
        setProcessingProgress(0);
      }, 600);
    } catch (err) {
      clearInterval(progressInterval);
      setIsExtracting(false);
      setProcessingProgress(0);
      toast({
        title: "Extraction Error",
        description: "Could not extract embodiments from the uploaded file.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePatent = (patent: string) => {
    setSelectedPatents((prev) => prev.filter((p) => p !== patent));
    setSelectedPdfIds((prev) =>
      prev.filter((id) => {
        const matchingPdf = availablePdfs.find((pdf) => pdf.id === id);
        return matchingPdf?.name !== patent;
      })
    );

    setAvailablePdfs(
      (prev) =>
        prev
          .map((pdf) => {
            if (pdf.name !== patent) return pdf;

            // Remove if uploaded, else just deselect
            const isUploaded = uploadedFile?.name === patent;
            return isUploaded ? null : { ...pdf, selected: false };
          })
          .filter(Boolean) // Remove `null` values
    );

    if (uploadedFile?.name === patent) {
      setUploadedFile(null);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleEmbodimentSelection = (tabName: string, embodimentId: number) => {
    setEmbodiments((prev) => {
      const newEmbodiments = { ...prev };
      const tabEmbodiments = [
        ...newEmbodiments[tabName as keyof typeof newEmbodiments],
      ];
      const index = tabEmbodiments.findIndex((e) => e.id === embodimentId);

      if (index !== -1) {
        tabEmbodiments[index] = {
          ...tabEmbodiments[index],
          selected: !tabEmbodiments[index].selected,
        };
        newEmbodiments[tabName as keyof typeof newEmbodiments] = tabEmbodiments;
      }

      return newEmbodiments;
    });
  };

  const getSelectedEmbodimentsCount = () => {
    let count = 0;
    Object.values(embodiments).forEach((tabEmbodiments) => {
      count += tabEmbodiments.filter((e) => e.selected).length;
    });
    return count;
  };

  const getTotalEmbodimentsCount = () => {
    let count = 0;
    Object.values(embodiments).forEach((tabEmbodiments) => {
      count += tabEmbodiments.length;
    });
    return count;
  };

  // Function to find an embodiment by ID across all sections
  const findEmbodimentById = (id: number): Embodiment | null => {
    for (const section of Object.values(embodiments)) {
      const found = section.find((e) => e.id === id);
      if (found) return found;
    }
    return null;
  };

  // Function to find a remixed embodiment by ID
  const findRemixedEmbodimentById = (id: number): RemixedEmbodiment | null => {
    return remixedEmbodiments.find((e) => e.id === id) || null;
  };

  // Function to create a remixed version of an embodiment based on similarity percentage
  const createRemixedEmbodiment = async (
    originalId: number,
    similarityPercentage: number
  ) => {
    setIsCreatingRemix(true);
    setCurrentStep("create");

    const originalEmbodiment = findEmbodimentById(originalId);
    if (!originalEmbodiment) {
      setIsCreatingRemix(false);
      return;
    }

    let knowledge;
    if (typeof window !== "undefined" && window.getStoredKnowlegde) {
      knowledge = await window.getStoredKnowlegde();
    }

    const source_embodiment = originalEmbodiment.title;
    const inspiration = similarityPercentage;

    // Pull required query params
    const params = new URLSearchParams(window.location.search);
    const patent_title = params.get("patentName") || "Untitled Patent";
    const disease = params.get("disease") || "unspecified";
    const antigen = params.get("antigen") || "unspecified";
    const file_id = selectedPdfIds[0];

    await axios
      .post(`${backendUrl}/v1/embodiment`, {
        file_id,
        inspiration,
        patent_title,
        disease,
        antigen,
        knowledge: knowledge,
      })
      .then((res) => {
        const result = res.data;

        const newRemixedEmbodiment: RemixedEmbodiment = {
          id: Date.now(),
          originalId,
          title: `Remixed ${source_embodiment}`,
          description: result?.content || "Generated embodiment text.",
          similarityPercentage,
          createdAt: new Date().toISOString(),
        };

        setRemixedEmbodiments((prev) => [...prev, newRemixedEmbodiment]);
        setIsCreatingRemix(false);
      })
      .catch((err) => {
        console.error("Embodiment generation failed:", err);
        setIsCreatingRemix(false);
        toast({
          title: "Error generating embodiment",
          description: "Please try again later.",
          variant: "destructive",
        });
      });
  };

  // Function to save an embodiment to stored knowledge
  const saveEmbodiment = (
    embodiment: Embodiment | RemixedEmbodiment,
    source: string
  ) => {
    const sectionMap: Record<string, string> = {
      summary: "Summary of Invention",
      description: "Detailed Description",
      claims: "Claims",
    };

    let resolvedSection = "";

    if (source === "remixed") {
      const originalEmbodiment = findEmbodimentById(
        (embodiment as RemixedEmbodiment).originalId
      );

      if (originalEmbodiment) {
        for (const [key, value] of Object.entries(embodiments)) {
          if (value.some((e) => e.id === originalEmbodiment.id)) {
            resolvedSection = sectionMap[key];
            break;
          }
        }

        // ✅ Avoid duplicate saves
        if (isEmbodimentAlreadySaved(embodiment as RemixedEmbodiment)) {
          toast({
            title: "Already Saved",
            description: "This remixed embodiment was already saved.",
            variant: "default",
          });
          return;
        }

        if (typeof window !== "undefined" && window.addKnowledgeEntry) {
          window.addKnowledgeEntry(
            resolvedSection,
            embodiment.title,
            embodiment.description,
            "123abc",
            true
          );
        }
      }
    } else {
      for (const [key, value] of Object.entries(embodiments)) {
        if (value.some((e) => e.id === (embodiment as Embodiment).id)) {
          resolvedSection = sectionMap[key];
          break;
        }
      }
    }

    const newStoredKnowledge: StoredKnowledge = {
      id: Date.now(),
      title: embodiment.title,
      description: embodiment.description,
      source,
      section: resolvedSection || "Unknown",
      savedAt: new Date().toISOString(),
    };

    setStoredKnowledge((prev) => [...prev, newStoredKnowledge]);

    toast({
      title: "Embodiment saved",
      description: "The embodiment has been added to your stored knowledge.",
      duration: 3000,
    });
  };

  // Replace the startEditing function with this new version
  const startEditing = (embodiment: RemixedEmbodiment) => {
    setEditingEmbodiment(embodiment);
    setEditingText(embodiment.description);
    setEditDialogOpen(true);

    // Focus the textarea after it renders
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Replace the saveEditedText function with this new version
  const saveEditedText = () => {
    if (!editingEmbodiment) return;

    setRemixedEmbodiments((prev) =>
      prev.map((e) =>
        e.id === editingEmbodiment.id ? { ...e, description: editingText } : e
      )
    );
    setEditDialogOpen(false);
    setEditingEmbodiment(null);

    toast({
      title: "Changes saved",
      description: "Your edits have been saved successfully.",
      duration: 3000,
    });
  };

  // Placeholder function for regenerateEmbodiment
  const regenerateEmbodiment = (embodiment: RemixedEmbodiment) => {
    // Implement your regeneration logic here
    setIsCreatingRemix(true);

    setTimeout(() => {
      // Create a slightly different version
      const newDescription = embodiment.description.replace(
        /\. /g,
        ". This has been enhanced with improved algorithms. "
      );

      setRemixedEmbodiments((prev) =>
        prev.map((e) =>
          e.id === embodiment.id
            ? {
                ...e,
                description: newDescription,
                createdAt: new Date().toISOString(),
              }
            : e
        )
      );

      setIsCreatingRemix(false);

      toast({
        title: "Embodiment regenerated",
        description: "The embodiment has been successfully regenerated.",
        duration: 3000,
      });
    }, 1500);
  };

  const handlePdfUpload = (sectionId: string, file: File) => {
    // In a real app, we would upload the file to a server
    // For now, we'll just add it to our mock data
    const newPdf = {
      id: `pdf-${Date.now()}`,
      name: file.name,
      section: sectionId,
      url: URL.createObjectURL(file),
    };

    setPdfs([...pdfs, newPdf]);
  };

  // Add this function to handle showing metadata for extracted embodiments
  const showExtractedMetadata = (embodiment: Embodiment) => {
    setSelectedMetadataEmbodiment(embodiment);
    setMetadataType("extracted");
    setShowMetadataDialog(true);
  };

  // Add this function to handle showing metadata for remixed embodiments
  const showRemixedMetadata = (embodiment: RemixedEmbodiment) => {
    setSelectedMetadataEmbodiment(embodiment);
    setMetadataType("remixed");
    setShowMetadataDialog(true);
  };

  // Add a function to toggle PDF selection
  const togglePdfSelection = async (id: string) => {
    const updatedList = availablePdfs.map((pdf) => ({
      ...pdf,
      selected: pdf.id === id,
    }));
    const selectedDoc = updatedList.find((pdf) => pdf.id === id);
    setAvailablePdfs(updatedList);
    setSelectedPdfIds([id]);
    setSelectedPatents(selectedDoc ? [selectedDoc.name] : []);
    setUploadedFile(null);

    try {
      const res = await axios.get(`${backendUrl}/v1/source-embodiments/${id}`);

      const data = res.data.data;
      const mapped = transformGroupedEmbodiments(res.data || {});
      const abst = res.data.abstract;
      setAbstract(abst);
      setSelectedPdfIds([res.data.data[0].file_id]);

      setEmbodiments(mapped);

      // ✅ Correctly assign filename to each chunk
      const updatedChunks = data.map((chunk) => ({
        ...chunk,
        filename: selectedDoc?.name || chunk.filename,
      }));

      const keyTerms = res.data?.terms || null;

      setKeyTermsFromApi(keyTerms);
      setEmbodiments(mapped);
      setShowResearchSections(true);
      setShowSplitScreen(true);
      setCurrentStep("review");
    } catch (err) {
      setEmbodiments({ summary: [], description: [], claims: [] });
      setShowResearchSections(false);
      setCurrentStep("upload");
    }
  };

  const isEmbodimentAlreadySaved = (embodiment: RemixedEmbodiment): boolean => {
    return storedKnowledge.some(
      (item) =>
        item.title === embodiment.title &&
        item.description === embodiment.description &&
        item.source === "remixed"
    );
  };

  const [showKeyTerms, setShowKeyTerms] = useState(true);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPdfs: PdfFile[] = [];

      Array.from(e.target.files).forEach((file) => {
        const fileSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";
        const newPdf: PdfFile = {
          id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          selected: true,
          size: fileSize,
          uploadDate: new Date().toISOString().split("T")[0],
        };

        newPdfs.push(newPdf);
        setSelectedPatents((prev) => [...prev, file.name]);
      });

      setAvailablePdfs((prev) => [...prev, ...newPdfs]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  const tableOfContents = [
    { id: "abstract", title: "Abstract", level: 1 },
    { id: "key-terms", title: "Key Terms", level: 1 },
    { id: "summary-of-invention", title: "Summary of Invention", level: 1 },
    { id: "detailed-description", title: "Detailed Description", level: 1 },
    ...Array.from(new Set(embodiments.description.map((e) => e.header)))
      .filter(Boolean)
      .flatMap((header) => {
        const headerId = slugify(header!);
        const headerItem = { id: headerId, title: header!, level: 2 };
        const categoryItems = Array.from(
          new Set(
            embodiments.description
              .filter((e) => e.header === header)
              .map((e) => e.category)
          )
        )
          .filter(Boolean)
          .map((category) => ({
            id: `${headerId}-${slugify(category!)}`,
            title: category!,
            level: 3,
          }));
        return [headerItem, ...categoryItems];
      }),
    { id: "claims", title: "Claims", level: 1 },
    ...(remixedEmbodiments.length > 0
      ? [{ id: "new-embodiments", title: "New Embodiments", level: 1 }]
      : []),
  ];

  // Filter and sort PDFs
  const filteredPdfs = availablePdfs;

  const allHeaders = Array.from(
    new Set(embodiments.description.map((e) => e.header || "Ungrouped"))
  );

  // Create map with empty arrays for all found headers
  const grouped: Record<string, Embodiment[]> = {};
  for (const header of allHeaders) {
    grouped[header] = [];
  }

  // Populate with actual embodiments
  for (const emb of embodiments.description) {
    const key = emb.header || "Ungrouped";
    grouped[key].push(emb);
  }

  const sortedGroupedEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "Ungrouped") return 1;
    if (b === "Ungrouped") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex">
      {isProcessingPdf && (
        <ProcessingLoader processingFileName={processingFileName} />
      )}

      {/* PDF Processing Success - Full Screen with Confetti */}
      {processingComplete && (
        <ProcessCompleteLoader
          processingFileName={processingFileName}
          showConfetti={showConfetti}
          successIcon={successIconRef}
        />
      )}

      {showSplitScreen && (
        <aside
          className={`relative bg-muted/30 border-r z-20 transition-all duration-300 ease-in-out ${
            sourcesPanelCollapsed ? "w-12" : "w-1/3 max-w-lg"
          } hidden lg:flex flex-col flex-shrink-0 h-screen`}
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
                <div className="p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-background p-4 rounded-md">
                    {splitScreenContent.content}
                  </pre>
                </div>
              </ScrollArea>
            </>
          )}
        </aside>
      )}

      <div className={`flex-1 `}>
        <ScrollArea className="flex-1">
          <main className="container mx-auto px-4 py-8 relative h-screen overflow-y-auto">
            <StoredKnowledge stage={stage} setStage={setStage} />
            {/* Patent Documents Section - Adjust top margin since we removed the header */}
            <div className="border rounded-lg p-6 shadow-sm mb-8 mt-16">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Patent Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Upload new patents or select from your previously uploaded
                  documents
                </p>
              </div>

              {/* PDF Selection */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Library className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Select or Upload Patents</h3>
                </div>
              </div>

              {/* PDF Selection - Updated UI */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Simplified PDF Dropdown */}
                  <div className="relative w-[300px] pdf-dropdown">
                    <button
                      className="w-full flex items-center justify-between border border-input bg-background px-3 py-2 text-sm rounded-md"
                      onClick={() => setPdfDropdownOpen(!pdfDropdownOpen)}
                    >
                      <span>Select PDFs</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>

                    {pdfDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg pdf-dropdown">
                        <div className="max-h-60 overflow-auto p-1">
                          {availablePdfs.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              No PDFs available
                            </div>
                          ) : (
                            availablePdfs.map((pdf) => (
                              <div
                                key={pdf.id}
                                className="flex items-center px-2 py-2 hover:bg-gray-100 rounded"
                              >
                                <input
                                  type="checkbox"
                                  id={pdf.id}
                                  checked={pdf.selected}
                                  onChange={() => togglePdfSelection(pdf.id)}
                                  className="h-4 w-4 mr-2"
                                />
                                <label
                                  htmlFor={pdf.id}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {pdf.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload PDF Button */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      id={`pdf-upload-test`}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label
                        htmlFor={`pdf-upload-test`}
                        className="cursor-pointer flex items-center"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                        ) : uploadSuccess ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 transition-all duration-300" />
                        ) : (
                          <FileUp className="h-4 w-4 mr-2 transition-all duration-300" />
                        )}
                        Upload PDF
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selected Documents - Only shown when patents are selected */}
              {selectedPatents.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">
                    Selected Documents ({selectedPatents.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedPatents.map((patent, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted px-4 py-3 rounded-md"
                      >
                        <div className="flex items-center">
                          <File className="h-5 w-5 mr-3 text-primary" />
                          <span className="font-medium">{patent}</span>
                        </div>
                        <button
                          className="h-8 w-8 rounded-full hover:bg-background/50 flex items-center justify-center"
                          onClick={() => handleRemovePatent(patent)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Button
                  size="lg"
                  className="py-6 text-lg gap-2 w-64"
                  onClick={handleExtractEmbodiments}
                  disabled={
                    isExtracting ||
                    selectedPatents.length === 0 ||
                    extractButtonDisabled
                  }
                >
                  <Sparkles className="h-5 w-5" />
                  Extract Embodiments
                </Button>
              </div>
            </div>

            {/* Extracting Embodiments Overlay */}
            {isExtracting && (
              <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-medium mb-2">
                    Extracting Embodiments
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    AI is analyzing patent documents to extract key embodiments
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mb-6">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This process may take a few minutes as we identify and
                    categorize all embodiments in your patents.
                  </p>
                </div>
              </div>
            )}

            {/* Creating Remix Overlay */}
            {isCreatingRemix && (
              <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-medium mb-2">
                    Creating New Embodiment
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    AI is generating a remixed version of the embodiment
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mb-6">
                    <div className="bg-primary h-2 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This process may take a few moments as we create a new
                    embodiment based on your selected similarity percentage.
                  </p>
                </div>
              </div>
            )}

            {/* Research Sections - Only shown after embodiments are extracted */}
            {showResearchSections && (
              <div className="border rounded-lg p-6 shadow-sm mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Extracted Embodiments</h2>
                    <span className="text-sm text-muted-foreground">
                      {getSelectedEmbodimentsCount()} of{" "}
                      {getTotalEmbodimentsCount()} embodiments selected
                    </span>
                  </div>

                  <div
                    id="abstract"
                    data-section-id="abstract"
                    className="mb-12 pt-4"
                  >
                    <div
                      className="group border-l-4 border-primary pl-4 mb-6 flex justify-between items-center cursor-pointer"
                      onClick={() => setShowAbstract(!showAbstract)}
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          Abstract
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Patent abstract and overview
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOriginal(
                              "Abstract",
                              mockRawData.abstract
                            );
                          }}
                        >
                          View Original
                        </Button> */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowAbstract(!showAbstract)}
                          aria-label={
                            showAbstract
                              ? "Collapse Abstract"
                              : "Expand Abstract"
                          }
                        >
                          {showAbstract ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {showAbstract && (
                      <div className="border rounded-lg p-6 bg-gray-50 shadow-sm">
                        <div className="space-y-4 text-sm text-gray-700">
                          <p>{abstract}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Terms Section - Before all embodiment sections */}
                  <div
                    id="key-terms"
                    data-section-id="key-terms"
                    className="mb-12 pt-4"
                  >
                    <div
                      className="group border-l-4 border-primary pl-4 mb-6 flex justify-between items-center cursor-pointer"
                      onClick={() => setShowKeyTerms(!showKeyTerms)}
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          Key Terms
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Important terminology and definitions
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOriginal("Key Terms", rawData.keyterms);
                          }}
                        >
                          View Original
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowKeyTerms(!showKeyTerms)}
                          aria-label={
                            showKeyTerms
                              ? "Collapse Key Terms"
                              : "Expand Key Terms"
                          }
                        >
                          {showKeyTerms ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {showKeyTerms && (
                      <Accordion
                        type="single"
                        collapsible
                        className="border rounded-md"
                      >
                        {keyTermsFromApi.map((item) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                              <span className="font-medium">{item.term}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-2 text-sm">
                              {item.definition}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>

                  {/* Summary of Invention Section */}
                  <div
                    id="summary-of-invention"
                    data-section-id="summary-of-invention"
                    className="mb-12 pt-4"
                  >
                    <div
                      className="group border-l-4 border-primary pl-4 mb-6 flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setShowSummaryOfInvention(!showSummaryOfInvention)
                      }
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          Summary of Invention
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {embodiments.summary.length} embodiments extracted
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOriginal(
                              "Summary of Invention",
                              rawData.summary
                            );
                          }}
                        >
                          View Original
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setShowSummaryOfInvention(!showSummaryOfInvention)
                          }
                          aria-label={
                            showSummaryOfInvention
                              ? "Collapse Summary of Invention"
                              : "Expand Summary of Invention"
                          }
                        >
                          {showSummaryOfInvention ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Section Summary Box */}
                    {showSummaryOfInvention && (
                      <>
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                          <h4 className="font-semibold text-md mb-2 text-gray-700">
                            Section Summary
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>
                              This section outlines the core innovations of the
                              invention, providing a high-level overview of the
                              system, method, and apparatus. It details the
                              primary components and their interactions,
                              establishing the foundational concepts that are
                              further elaborated in the detailed description.
                            </p>
                            <p>
                              Key advantages highlighted include significant
                              reductions in material waste, lower energy
                              consumption, and enhanced device durability,
                              addressing major challenges in modern electronics
                              manufacturing.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll("summary", true)}
                          >
                            Approve All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll("summary", false)}
                          >
                            Reject All
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {embodiments.summary.map(
                            (embodiment) =>
                              embodiment.description !== "" && (
                                <div
                                  key={embodiment.id}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium">
                                      {embodiment.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                          embodiment.selected
                                            ? "bg-green-100 text-green-700 border border-green-300"
                                            : "bg-red-100 text-red-600 border border-red-300 hover:bg-red-200"
                                        }`}
                                        onClick={(e) => {
                                          toggleEmbodimentSelection(
                                            "summary",
                                            embodiment.id
                                          );
                                        }}
                                      >
                                        {embodiment.selected
                                          ? "approved"
                                          : "rejected"}
                                      </button>
                                      <button
                                        className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                                        onClick={() =>
                                          showExtractedMetadata(embodiment)
                                        }
                                      >
                                        Meta-data
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mb-2 text-sm font-medium p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                                    {embodiment.summary}
                                  </div>

                                  <p className="text-sm">
                                    {embodiment.description}
                                  </p>
                                  <div className="mt-3 flex justify-between items-center">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Source: {embodiment.source}
                                    </Badge>
                                    {/* <button
                                    className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                                    onClick={() =>
                                      setOpenPopupId(embodiment.id)
                                    }
                                  >
                                    Create
                                  </button> */}
                                  </div>
                                </div>
                              )
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Detailed Description Section */}
                  <div
                    id="detailed-description"
                    data-section-id="detailed-description"
                    className="mb-12 pt-4"
                  >
                    <div
                      className="group border-l-4 border-primary pl-4 mb-6 flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setShowDetailedDescription(!showDetailedDescription)
                      }
                    >
                      <div className="">
                        <h3 className="text-2xl font-bold text-primary">
                          Detailed Description
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {embodiments.description.length} embodiments extracted
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOriginal(
                              "Detailed Description",
                              rawData.description
                            );
                          }}
                        >
                          View Original
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setShowDetailedDescription(!showDetailedDescription)
                          }
                          aria-label={
                            showDetailedDescription
                              ? "Collapse Detailed Description"
                              : "Expand Detailed Description"
                          }
                          className="mr-2" // Add some margin if needed
                        >
                          {showDetailedDescription ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {showDetailedDescription && (
                      <>
                        <div className="flex justify-end gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll("description", true)}
                          >
                            Approve All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSelectAll("description", false)
                            }
                          >
                            Reject All
                          </Button>
                        </div>
                        <div className="space-y-6">
                          {/* Group embodiments by header first, then by category */}
                          {Array.from(
                            new Set(
                              embodiments.description.map((e) => e.header)
                            )
                          )
                            .filter(Boolean)
                            .map((header) => {
                              const headerId = slugify(header!);
                              // Get all embodiments with this header
                              const headerEmbodiments =
                                embodiments.description.filter(
                                  (e) => e.header === header
                                );

                              const headingSummary =
                                headerEmbodiments[0].headingSummary;

                              console.log("Header", header);
                              console.log("Hello", headerEmbodiments);
                              console.log("Summary", headingSummary);

                              // Get unique categories within this header
                              const categories = Array.from(
                                new Set(
                                  headerEmbodiments.map((e) => e.category)
                                )
                              ).filter(Boolean);

                              return (
                                <div
                                  key={`header-${header}`}
                                  id={headerId}
                                  data-section-id={headerId}
                                  className="mb-10 pt-4"
                                >
                                  <h2 className="text-xl font-bold mb-6 pb-2 border-b">
                                    {header}
                                  </h2>

                                  {categories.map((category) => {
                                    const categoryId = `${headerId}-${slugify(
                                      category!
                                    )}`;
                                    // Get embodiments for this header and category
                                    const categoryEmbodiments =
                                      headerEmbodiments.filter(
                                        (e) => e.category === category
                                      );

                                    return (
                                      <div
                                        key={`${header}-${category}`}
                                        id={categoryId}
                                        data-section-id={categoryId}
                                        className="mb-8 pt-4"
                                      >
                                        <h3 className="text-lg font-semibold capitalize border-b pb-2 mb-4">
                                          {category}
                                          <span className="ml-2 text-sm text-muted-foreground font-normal">
                                            (
                                            {categoryEmbodiments[0]
                                              .description !== ""
                                              ? categoryEmbodiments.length
                                              : 0}{" "}
                                            embodiments)
                                          </span>
                                        </h3>

                                        {/* Sub-section summary box */}
                                        <div className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                                          <h4 className="font-semibold text-md mb-2 text-gray-700">
                                            Summary for {category}
                                          </h4>
                                          <div className="text-sm text-gray-600">
                                            {headerEmbodiments[0]
                                              ?.headingSummary ||
                                              "No summary available."}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          {categoryEmbodiments.map(
                                            (embodiment) =>
                                              embodiment.description !== "" && (
                                                <div
                                                  key={embodiment.id}
                                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                                >
                                                  <div className="flex justify-between items-center mb-2">
                                                    <h3 className="font-medium">
                                                      {embodiment.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                          embodiment.selected
                                                            ? "bg-green-100 text-green-700 border border-green-300"
                                                            : "bg-red-100 text-red-600 border border-red-300 hover:bg-red-200"
                                                        }`}
                                                        onClick={(e) => {
                                                          toggleEmbodimentSelection(
                                                            "description",
                                                            embodiment.id
                                                          );
                                                        }}
                                                      >
                                                        {embodiment.selected
                                                          ? "approved"
                                                          : "rejected"}
                                                      </button>
                                                      <button
                                                        className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                                                        onClick={() =>
                                                          showExtractedMetadata(
                                                            embodiment
                                                          )
                                                        }
                                                      >
                                                        Meta-data
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <div className="mb-2 text-sm font-medium p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                                                    {embodiment.summary}
                                                  </div>

                                                  <p className="text-sm">
                                                    {embodiment.description}
                                                  </p>
                                                  <div className="mt-3 flex justify-between items-center">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      Source:{" "}
                                                      {embodiment.source}
                                                    </Badge>
                                                    {/* <button
                                                    className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                                                    onClick={() =>
                                                      setOpenPopupId(
                                                        embodiment.id
                                                      )
                                                    }
                                                  >
                                                    Create
                                                  </button> */}
                                                  </div>
                                                </div>
                                              )
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Claims Section */}
                  <div
                    id="claims"
                    data-section-id="claims"
                    className="mb-12 pt-4"
                  >
                    <div
                      className="group border-l-4 border-primary pl-4 mb-6 flex justify-between items-center cursor-pointer"
                      onClick={() => setShowClaims(!showClaims)}
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          Claims
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {embodiments.claims.length} embodiments extracted
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOriginal("Claims", rawData.claims);
                          }}
                        >
                          View Original
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowClaims(!showClaims)}
                          aria-label={
                            showClaims ? "Collapse Claims" : "Expand Claims"
                          }
                          className="mr-2" // Add some margin if needed
                        >
                          {showClaims ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Section Summary Box */}
                    {showClaims && (
                      <>
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                          <h4 className="font-semibold text-md mb-2 text-gray-700">
                            Section Summary
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>
                              This section defines the legal scope of the
                              invention. It includes independent claims covering
                              the overall system and method, as well as
                              dependent claims that specify particular features
                              and refinements. The claims are drafted to protect
                              the novel aspects of the manufacturing process and
                              the resulting electronic device.
                            </p>
                            <p>
                              The claims cover the unique combination of
                              material processing, component assembly, and
                              quality control subsystems, which collectively
                              achieve unprecedented efficiency and product
                              quality.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll("claims", true)}
                          >
                            Approve All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAll("claims", false)}
                          >
                            Reject All
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {embodiments.claims.map((embodiment) => (
                            <div
                              key={embodiment.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">
                                  {embodiment.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <button
                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                      embodiment.selected
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-red-100 text-red-600 border border-red-300 hover:bg-red-200"
                                    }`}
                                    onClick={(e) => {
                                      toggleEmbodimentSelection(
                                        "claims",
                                        embodiment.id
                                      );
                                    }}
                                  >
                                    {embodiment.selected
                                      ? "approved"
                                      : "rejected"}
                                  </button>
                                  <button
                                    className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                                    onClick={() =>
                                      showExtractedMetadata(embodiment)
                                    }
                                  >
                                    Meta-data
                                  </button>
                                </div>
                              </div>
                              <div className="mb-2 text-sm font-medium p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                                {embodiment.summary}
                              </div>

                              <p className="text-sm">
                                {embodiment.description}
                              </p>
                              <div className="mt-3 flex justify-between items-center">
                                <Badge variant="outline" className="text-xs">
                                  Source: {embodiment.source}
                                </Badge>
                                {/* <button
                                className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                                onClick={() => setOpenPopupId(embodiment.id)}
                              >
                                Create
                              </button> */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* New Embodiments Section - Only shown when there are remixed embodiments */}
            {remixedEmbodiments.length > 0 && (
              <div
                id="new-embodiments"
                data-section-id="new-embodiments"
                className="border rounded-lg p-6 shadow-sm pt-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-xl font-bold">New Embodiments</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI-generated variations of your selected embodiments
                  </p>

                  {/* Remixed Embodiment Cards */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {remixedEmbodiments.map((embodiment) => (
                      <div
                        key={embodiment.id}
                        className="border border-yellow-400 rounded-lg p-4 bg-yellow-50 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{embodiment.title}</h3>
                          <button
                            className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                            onClick={() => showRemixedMetadata(embodiment)}
                          >
                            Meta-data
                          </button>
                        </div>

                        <p className="text-sm">{embodiment.description}</p>

                        <div className="mt-3 flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            Similarity: {embodiment.similarityPercentage}%
                          </Badge>
                          <div className="flex gap-2">
                            <button
                              className="text-xs bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600"
                              onClick={() =>
                                saveEmbodiment(embodiment, "remixed")
                              }
                            >
                              <span className="flex items-center gap-1">
                                <Save className="h-3 w-3" />
                                Save
                              </span>
                            </button>
                            <button
                              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600"
                              onClick={() => startEditing(embodiment)}
                            >
                              <span className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </span>
                            </button>
                            <button
                              className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600"
                              onClick={() => regenerateEmbodiment(embodiment)}
                            >
                              <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Redo
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Percentage Selection Dialog */}
            <Dialog
              open={openPopupId !== null}
              onOpenChange={(open) => !open && setOpenPopupId(null)}
            >
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Select Percentage Similarity</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  {[25, 50, 75, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      className="h-20 text-lg font-medium hover:bg-primary hover:text-white"
                      onClick={() => {
                        if (openPopupId) {
                          createRemixedEmbodiment(openPopupId, percentage);
                        }
                        setOpenPopupId(null);
                      }}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Embodiment Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Embodiment</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    ref={textareaRef}
                    className="w-full min-h-[200px] p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveEditedText}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Metadata Dialog */}
            <Dialog
              open={showMetadataDialog}
              onOpenChange={setShowMetadataDialog}
            >
              <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {metadataType === "extracted"
                      ? "Extracted Embodiment Metadata"
                      : "Remixed Embodiment Comparison"}
                  </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                  {selectedMetadataEmbodiment && (
                    <>
                      {metadataType === "extracted" ? (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">
                              {selectedMetadataEmbodiment.title}
                            </h3>
                            <p className="text-sm">
                              {selectedMetadataEmbodiment.description}
                            </p>
                          </div>

                          <div>
                            <h3 className="font-medium mb-2">
                              Source Text Chunks
                            </h3>
                            <div className="space-y-3">
                              {/* Mock source chunks - in a real app, these would come from the extraction process */}
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="border-l-4 border-primary pl-4 py-2 bg-primary/5"
                                >
                                  <p className="text-sm">
                                    {`Source text chunk ${i} that was used to extract this embodiment. This would contain the original patent text that was processed to identify this specific embodiment. The AI system analyzed patterns, terminology, and structural elements to identify this as a distinct embodiment within the patent document.`}
                                  </p>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    Source:{" "}
                                    {(selectedMetadataEmbodiment as Embodiment)
                                      .source || "US Patent Document"}
                                    , Section {i}, Page {i + 2}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              Similarity:{" "}
                              {
                                (
                                  selectedMetadataEmbodiment as RemixedEmbodiment
                                ).similarityPercentage
                              }
                              %
                            </h3>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Remixed on{" "}
                              {new Date(
                                (
                                  selectedMetadataEmbodiment as RemixedEmbodiment
                                ).createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            {/* Original Embodiment */}
                            <div>
                              <h3 className="font-medium mb-2 pb-2 border-b">
                                Original Embodiment
                              </h3>
                              {(() => {
                                const originalEmbodiment = findEmbodimentById(
                                  (
                                    selectedMetadataEmbodiment as RemixedEmbodiment
                                  ).originalId
                                );
                                return originalEmbodiment ? (
                                  <div className="border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-medium text-sm mb-1">
                                      {originalEmbodiment.title}
                                    </h4>
                                    <p className="text-sm">
                                      {originalEmbodiment.description}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Original embodiment not found
                                  </p>
                                );
                              })()}
                            </div>

                            {/* Remixed Embodiment */}
                            <div>
                              <h3 className="font-medium mb-2 pb-2 border-b">
                                Remixed Version
                              </h3>
                              <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                                <h4 className="font-medium text-sm mb-1">
                                  {selectedMetadataEmbodiment.title}
                                </h4>
                                <p className="text-sm">
                                  {selectedMetadataEmbodiment.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showRawDataModal} onOpenChange={setShowRawDataModal}>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    Original Raw Data: {rawDataContent.title}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md font-mono">
                    {rawDataContent.content}
                  </pre>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Toaster />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
