"use client";

import type React from "react";
import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  File,
  Library,
  CheckCircle,
  Lightbulb,
  Database,
  Save,
  Edit2,
  RefreshCw,
  ChevronDown,
  FileUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPdfs } from "@/lib/mock-data";
import { backendUrl } from "@/config/config";
import axios from "axios";
import { PDF } from "@/lib/types";
import ProcessingLoader from "./processingLoader";
import ProcessCompleteLoader from "./processCompleteLoader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export default function Embodiments() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [keyTermsFromApi, setKeyTermsFromApi] = useState<
    { term: string; definition?: string; page_number?: number }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showResearchSections, setShowResearchSections] = useState(false);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedPatents, setSelectedPatents] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | "">("");
  const [visibleSummaries, setVisibleSummaries] = useState<
    Record<number, boolean>
  >({});
  const [activeTab, setActiveTab] = useState("summary");
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [pdfList, setPdfList] = useState<PDF[]>([]);
  const [processingFileName, setProcessingFileName] = useState("");
  const [embodiments, setEmbodiments] = useState<EmbodimentMap>({
    summary: [],
    description: [],
    claims: [],
  });
  const [patentId, setPatentId] = useState<string>("");

  const toggleSummary = (embodimentId: number) => {
    setVisibleSummaries((prev) => ({
      ...prev,
      [embodimentId]: !prev[embodimentId],
    }));
  };

  const fetchEmbodiments = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/v1/source-embodiments/${patentId}`
      );

      console.log("Here", response);
      const data: RawChunk[] = response.data || [];

      const mappedEmbodiments = transformApiEmbodiments(data);
      if (
        mappedEmbodiments.summary.length > 0 ||
        mappedEmbodiments.description.length > 0 ||
        mappedEmbodiments.claims.length > 0
      ) {
        setShowResearchSections(true);
        setCurrentStep("review");
      }
      console.log("Mapped", mappedEmbodiments);
      setEmbodiments(mappedEmbodiments);
    } catch (err) {
      console.log("Error fetching embodiments:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentId(params.get("patentId"));
    }
  }, []);

  // useEffect(() => {
  //   if (patentId) {
  //     fetchEmbodiments();
  //   }
  // }, [patentId]);
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

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("A");
  //   if (e.target.files && e.target.files[0]) {
  //     console.log("B");
  //     const file = e.target.files[0];
  //     setProcessingFileName(file.name);
  //     setIsProcessingPdf(true);

  //     try {
  //       const formData = new FormData();
  //       formData.append("file", file);

  //       await axios.post(`${backendUrl}/v1/documents/`, formData, {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       });

  //       // Fetch updated documents list
  //       const { data } = await axios.get(`${backendUrl}/v1/documents/`);

  //       if (data.response) {
  //         const sortedDocuments = data.response.sort(
  //           (a: any, b: any) =>
  //             new Date(b.created_at).getTime() -
  //             new Date(a.created_at).getTime()
  //         );

  //         setPdfList(sortedDocuments);

  //         // Find the uploaded PDF
  //         let uploadedPDF: any;

  //         uploadedPDF = sortedDocuments.find(
  //           (item: PDF) =>
  //             item.name.replace(/[_\s]/g, "").toLowerCase() ===
  //             file.name.replace(/[_\s]/g, "").toLowerCase()
  //         );

  //         console.log("UUG", uploadedPDF);
  //         console.log("UygygyUG", sortedDocuments);
  //         console.log("UgygUG", file.name);

  //         if (uploadedPDF) {
  //           const updatedPDF = {
  //             ...uploadedPDF,
  //             selected: true,
  //           };

  //           setAvailablePdfs([{ ...uploadedPDF, selected: true }]);
  //           setSelectedPdfIds([uploadedPDF.id]);
  //           setSelectedPatents([uploadedPDF.name]);
  //         }
  //       }

  //       // ✅ Reset file input
  //       if (fileInputRef.current) {
  //         fileInputRef.current.value = "";
  //       }

  //       setUploadedFile(file);
  //       setIsProcessingPdf(false);
  //       setProcessingComplete(true);
  //       setTimeout(() => {
  //         setProcessingComplete(false);
  //       }, 3000);
  //     } catch (error) {
  //       console.error("Error uploading file:", error);
  //       setIsProcessingPdf(false);
  //     }
  //   }
  // };

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

        console.log("YY", response);
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
      const mapped = transformApiEmbodiments(data || []);
      const keyTerms = response.data.terms?.definitions || null;
      setSelectedPdfIds([response.data.file_id]);

      setKeyTermsFromApi(keyTerms);
      setEmbodiments(mapped);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      setTimeout(() => {
        setIsExtracting(false);
        setShowResearchSections(true);
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

    console.log("Uploaded file", uploadedFile);
    console.log("Updated PDFs", availablePdfs);
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

    console.log("Knwoldeg", knowledge);

    const source_embodiment = originalEmbodiment.title;
    const inspiration = similarityPercentage;

    // Pull required query params
    const params = new URLSearchParams(window.location.search);
    const patent_title = params.get("patentName") || "Untitled Patent";
    const disease = params.get("disease") || "unspecified";
    const antigen = params.get("antigen") || "unspecified";
    const file_id = selectedPdfIds[0];

    console.log("UUUU", selectedPdfIds);
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
      console.log("Res", res);
      const data: RawChunk[] = res.data.data || [];

      // ✅ Correctly assign filename to each chunk
      const updatedChunks = data.map((chunk) => ({
        ...chunk,
        filename: selectedDoc?.name || chunk.filename,
      }));

      const keyTerms = res.data?.terms || null;

      console.log("Key Terms", keyTerms);

      setKeyTermsFromApi(keyTerms);

      const newEmbodiments = transformApiEmbodiments(updatedChunks);
      setEmbodiments(newEmbodiments);
      setShowResearchSections(true);
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

  // Filter and sort PDFs
  const filteredPdfs = availablePdfs;

  const grouped = embodiments.description.reduce(
    (acc: Record<string, Embodiment[]>, curr) => {
      const key = curr.header || "Ungrouped";
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    },
    {}
  );

  const sortedGroupedEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "Ungrouped") return 1;
    if (b === "Ungrouped") return -1;
    return a.localeCompare(b);
  });

  return (
    <main className="container mx-auto px-4 py-8 relative">
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
      {/* Patent Documents Section - Adjust top margin since we removed the header */}
      <div className="border rounded-lg p-6 shadow-sm mb-8 mt-16">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Patent Documents</h2>
          <p className="text-sm text-muted-foreground">
            Upload new patents or select from your previously uploaded documents
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
                    {availablePdfs?.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No PDFs available
                      </div>
                    ) : (
                      availablePdfs?.map((pdf: any) => (
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
                onChange={handleFileChange} // Call the updated function
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
            <h3 className="text-xl font-medium mb-2">Extracting Embodiments</h3>
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
              This process may take a few minutes as we identify and categorize
              all embodiments in your patents.
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
              This process may take a few moments as we create a new embodiment
              based on your selected similarity percentage.
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
                {getSelectedEmbodimentsCount()} of {getTotalEmbodimentsCount()}{" "}
                embodiments selected
              </span>
            </div>

            {/* Tabs - Updated with new section names */}
            <Tabs
              defaultValue="summary"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary of Invention</TabsTrigger>
                <TabsTrigger value="description">
                  Detailed Description
                </TabsTrigger>
                <TabsTrigger value="claims">Claims</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {embodiments.summary.map((embodiment) => (
                    <div
                      key={embodiment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              embodiment.selected
                                ? "text-green-500"
                                : "text-gray-300"
                            }`}
                            onClick={(e) => {
                              toggleEmbodimentSelection(
                                "summary",
                                embodiment.id
                              );
                            }}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                            onClick={() => showExtractedMetadata(embodiment)}
                          >
                            Meta-data
                          </button>
                        </div>
                      </div>

                      <div className="mb-2 text-sm font-medium p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                        {embodiment.summary}
                      </div>

                      <p className="text-sm">{embodiment.description}</p>

                      <div className="mt-3 flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Source: {embodiment.source}
                        </Badge>
                        <button
                          className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                          onClick={() => setOpenPopupId(embodiment.id)}
                        >
                          Create
                        </button>
                      </div>

                      {/* Embodiment number shown at the bottom */}
                      <p className="mt-3 text-xs text-muted-foreground italic">
                        {embodiment.title}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="description" className="mt-4 space-y-6">
                {/* Key Terms Accordion */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Key Terms</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeyTerms(!showKeyTerms)}
                      className="text-xs"
                    >
                      {showKeyTerms ? "Hide Terms" : "Show Terms"}
                    </Button>
                  </div>
                  {showKeyTerms && (
                    <Accordion
                      type="single"
                      collapsible
                      className="border rounded-md"
                    >
                      {keyTermsFromApi.length > 0 &&
                        keyTermsFromApi.map((term, index) => (
                          <AccordionItem key={index} value={`term-${index}`}>
                            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                              <span className="font-medium">
                                {term.term.charAt(0).toUpperCase() +
                                  term.term.slice(1) || "Untitled Term"}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-2 text-sm">
                              {term.definition || "No definition available."}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  )}
                </div>

                {/* Embodiments by Header */}
                {sortedGroupedEntries.map(([header, items]) => (
                  <div key={header}>
                    {header === "Ungrouped" && (
                      <hr className="my-6 border-gray-300" />
                    )}
                    <div className="mb-10">
                      {header !== "Ungrouped" && (
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">
                          {header}
                        </h2>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {items.map((embodiment) => (
                          <div
                            key={embodiment.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    embodiment.selected
                                      ? "text-green-500"
                                      : "text-gray-300"
                                  }`}
                                  onClick={() =>
                                    toggleEmbodimentSelection(
                                      "description",
                                      embodiment.id
                                    )
                                  }
                                >
                                  <CheckCircle className="h-5 w-5" />
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
                            <p className="text-sm">{embodiment.description}</p>
                            <div className="mt-3 flex justify-between items-center">
                              <Badge variant="outline" className="text-xs">
                                Source: {embodiment.source}
                              </Badge>
                              <button
                                className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                                onClick={() => setOpenPopupId(embodiment.id)}
                              >
                                Create
                              </button>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground italic">
                              {embodiment.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="claims" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {embodiments.claims.map((embodiment) => (
                    <div
                      key={embodiment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              embodiment.selected
                                ? "text-green-500"
                                : "text-gray-300"
                            }`}
                            onClick={(e) => {
                              toggleEmbodimentSelection(
                                "claims",
                                embodiment.id
                              );
                            }}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                            onClick={() => showExtractedMetadata(embodiment)}
                          >
                            Meta-data
                          </button>
                        </div>
                      </div>

                      <div className="mb-2 text-sm font-medium p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                        {embodiment.summary}
                      </div>

                      <p className="text-sm">{embodiment.description}</p>

                      <div className="mt-3 flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          Source: {embodiment.source}
                        </Badge>
                        <button
                          className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
                          onClick={() => setOpenPopupId(embodiment.id)}
                        >
                          Create
                        </button>
                      </div>

                      {/* Embodiment number shown at the bottom */}
                      <p className="mt-3 text-xs text-muted-foreground italic">
                        {embodiment.title}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* New Embodiments Section - Only shown when there are remixed embodiments */}
      {remixedEmbodiments.length > 0 && (
        <div className="border rounded-lg p-6 shadow-sm">
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
                        onClick={() => saveEmbodiment(embodiment, "remixed")}
                        disabled={isEmbodimentAlreadySaved(embodiment)}
                      >
                        <span className="flex items-center gap-1">
                          <Save className="h-3 w-3" />
                          {isEmbodimentAlreadySaved(embodiment)
                            ? "Saved"
                            : "Save"}
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
            <textarea
              ref={textareaRef}
              className="w-full min-h-[200px] p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedText}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Metadata Dialog */}
      <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
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
                      <h3 className="font-medium mb-2">Source Text Chunk</h3>
                      <div className="space-y-3">
                        {/* Mock source chunks - in a real app, these would come from the extraction process */}
                        <div>
                          <h3 className="font-medium mb-2">Source Info</h3>
                          <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5">
                            <p className="text-sm text-muted-foreground">
                              <strong>Section:</strong>{" "}
                              {
                                (selectedMetadataEmbodiment as Embodiment)
                                  .section
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Filename:</strong>{" "}
                              {
                                (selectedMetadataEmbodiment as Embodiment)
                                  .source
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Page Number:</strong>{" "}
                              {
                                (selectedMetadataEmbodiment as Embodiment)
                                  .pageNumber
                              }
                            </p>
                          </div>
                        </div>
                        {/* {[1, 2, 3].map((i) => (
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
                        ))} */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        Similarity:{" "}
                        {
                          (selectedMetadataEmbodiment as RemixedEmbodiment)
                            .similarityPercentage
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
                            (selectedMetadataEmbodiment as RemixedEmbodiment)
                              .originalId
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

      <Toaster />
    </main>
  );
}
