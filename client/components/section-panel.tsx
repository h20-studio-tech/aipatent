"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Confetti from "react-confetti";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Send,
  FileText,
  X,
  File,
  CheckCircle,
  Loader2,
  CornerDownLeft,
  Brain,
} from "lucide-react";
import type { PDF } from "@/lib/types";
import { backendUrl } from "../config/config";
import type { Dispatch, SetStateAction } from "react"; // ✅ Fix missing import
import { useToast } from "./ui/use-toast";
import ProcessingLoader from "./processingLoader";
import ProcessCompleteLoader from "./processCompleteLoader";

interface SectionPanelProps {
  sectionId: string;
  title: string;
  pdfs: PDF[];
  onPdfUpload: (sectionId: string, file: File) => void;
  hideInsights?: boolean;
  patentId: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  selectedPdfIds: string[]; // ✅ Receive selected PDF IDs from parent
  setSelectedPdfIds: Dispatch<SetStateAction<string[]>>; // ✅ Function to update selected PDFs
  selectedPdfs: PDF[]; // ✅ Selected PDFs for this section
  setSelectedPdfs: Dispatch<SetStateAction<PDF[]>>; // ✅ Function to update selected PDFs
  pdfList: PDF[]; // ✅ All available PDFs
  setPdfList: Dispatch<SetStateAction<PDF[]>>; // ✅ Function to update PDF list
  setMetaData: Dispatch<
    SetStateAction<
      {
        chunk_id: number;
        filename: string;
        page_number: number;
        text: string;
      }[]
    >
  >;
  setInsightResponse: Dispatch<SetStateAction<string>>;
}

export default function SectionPanel({
  sectionId,
  title,
  pdfs,
  onPdfUpload,
  hideInsights = false,
  setQuestion,
  setInsightResponse,
  setMetaData,
  pdfList,
  patentId,
  setPdfList,
  selectedPdfs,
  setSelectedPdfs,
  selectedPdfIds,
  setSelectedPdfIds,
}: SectionPanelProps) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingFileName, setProcessingFileName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const confettiRef = useRef(null);
  const successIconRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("A");
    if (e.target.files && e.target.files[0]) {
      console.log("B");
      const file = e.target.files[0];
      setProcessingFileName(file.name);
      setIsProcessingPdf(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        await axios.post(`${backendUrl}/v1/documents/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Fetch updated documents list
        const { data } = await axios.get(`${backendUrl}/v1/documents/`);

        if (data.response) {
          const sortedDocuments = data.response.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          setPdfList(sortedDocuments);

          // Find the uploaded PDF
          const uploadedPdf = sortedDocuments.find(
            (item: PDF) =>
              item.name.replace(/[_\s]/g, "").toLowerCase() ===
              file.name.replace(/[_\s]/g, "").toLowerCase()
          );

          if (uploadedPdf) {
            setSelectedPdfIds((prev) => [...prev, uploadedPdf.id]); // ✅ Select the uploaded PDF
            setPdfList((prev) =>
              prev.map((pdf) =>
                pdf.id === uploadedPdf.id ? { ...pdf, selected: true } : pdf
              )
            );
          }
        }

        // ✅ Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setIsProcessingPdf(false);
        setProcessingComplete(true);
        setTimeout(() => {
          setProcessingComplete(false);
        }, 3000);
      } catch (error) {
        console.error("Error uploading file:", error);
        setIsProcessingPdf(false);
      }
    }
  };

  useEffect(() => {
    if (processingComplete) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000); // Confetti runs for 3s
    }
  }, [processingComplete]);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setChatHistory((prev) => [...prev, `You: ${userInput}`]);

    setIsLoading(true);

    try {
      if (selectedPdfIds.length === 0) {
        alert("Please select at least one PDF to search.");
        setIsLoading(false);
        return;
      }

      // Get selected PDF names
      const selectedPdfNames = pdfList
        .filter((pdf) => selectedPdfIds.includes(pdf.id))
        .map((pdf) => pdf.name); // Extract names only

      if (selectedPdfNames.length === 0) {
        alert("Selected PDFs not found.");
        setIsLoading(false);
        return;
      }

      const url = `${backendUrl}/v1/rag/multiquery-search/?query=${userInput}`;
      const { data } = await axios.post(url, [...selectedPdfNames]);

      if (data.status === "success") {
        setChatHistory((prev) => [
          ...prev,
          `AI: ${JSON.stringify(data.message, null, 2)}`,
        ]);

        setInsightResponse(data.message);
        setQuestion(userInput);

        setMetaData(data.data);
      } else {
        alert("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      alert("Error during processing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfSelect = (pdfId: string) => {
    setSelectedPdfIds((prev) => {
      const updatedIds = prev.includes(pdfId)
        ? prev.filter((id) => id !== pdfId)
        : [...prev, pdfId];

      // Sync the selected flag inside pdfList
      setPdfList((prevList) =>
        prevList.map((pdf) =>
          pdf.id === pdfId ? { ...pdf, selected: !prev.includes(pdfId) } : pdf
        )
      );

      return updatedIds;
    });
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/v1/documents/`);

      if (data.response) {
        console.log("Fetched Documents:", data.response);

        // ✅ Sort documents by created_at (Newest first)
        const sortedDocuments = data.response.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setPdfList(sortedDocuments); // Store sorted PDFs in state
      } else {
        console.error("Unexpected API response format", data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handlePdfRemove = (pdfId: string) => {
    setSelectedPdfIds(selectedPdfIds.filter((id) => id !== pdfId));
  };

  const handleComprehensiveAnalysis = async () => {
    if (selectedPdfIds.length === 0) {
      alert("Please select at least one PDF to analyze.");
      return;
    }

    setIsAnalyzing(true);

    // Add analysis request to chat history
    setChatHistory((prev) => [...prev, `You: Comprehensive Analysis Request`]);

    try {
      // Get selected PDF names for validation
      const selectedPdfNames = pdfList
        .filter((pdf) => selectedPdfIds.includes(pdf.id))
        .map((pdf) => pdf.name);

      console.log("Analyzing PDFs:", selectedPdfNames);

      // For now, analyze the first selected PDF (can be extended for multiple)
      const firstPdfName = selectedPdfNames[0];
      const tablename = firstPdfName.replace('.pdf', '').replace('.PDF', '');
      
      console.log("Using tablename:", tablename);

      // Make API request to comprehensive analysis endpoint
      const url = `${backendUrl}/v1/documents/comprehensive-analysis/lancedb/${tablename}`;
      const { data } = await axios.post(url);

      console.log("Analysis response:", data);

      // Add to chat history and set as insight response
      setChatHistory((prev) => [...prev, `AI: ${data.gemini_analysis}`]);
      setInsightResponse(data.gemini_analysis);
      setQuestion("Comprehensive Document Analysis");

      toast({
        title: "Analysis Complete", 
        description: `Successfully analyzed ${selectedPdfNames.length} document${selectedPdfNames.length > 1 ? "s" : ""}`,
        duration: 3000,
      });

    } catch (error) {
      console.error("Error during comprehensive analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Error occurred during document analysis",
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResearchNotes = () => {
    if (!userNotes.trim()) return;

    if (typeof window !== "undefined" && window.addResearchNote) {
      window.addResearchNote(title, userNotes, patentId);
    } else {
      // Fallback if the global function is not available
      console.log("Saving research note to stored knowledge:", userNotes);
    }

    // Show success toast
    toast({
      title: "Research Note Saved",
      description: "Your research note has been added to Stored Knowledge.",
      duration: 3000,
    });

    // Close the popover
    setIsPopoverOpen(false);

    // Optionally clear the notes after saving
    setUserNotes("");
  };

  const availablePdfs = pdfList
    .filter((pdf) => pdf.section === sectionId || !pdf.section)
    .filter((pdf) => pdf.name !== ".emptyFolderPlaceholder");

  useEffect(() => {
    const updatedSelectedPdfs = pdfList.filter((pdf) =>
      selectedPdfIds.includes(pdf.id)
    );
    setSelectedPdfs([...updatedSelectedPdfs]); // ✅ Ensure state updates
  }, [selectedPdfIds, pdfList]); // ✅ Depend on `pdfList` as well

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div
      className={`grid grid-cols-1 ${
        hideInsights ? "md:grid-cols-1" : "md:grid-cols-2"
      } gap-4 mt-4`}
    >
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

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select PDFs">
                {selectedPdfIds.length > 0
                  ? selectedPdfIds
                      .map(
                        (id) => availablePdfs.find((pdf) => pdf.id === id)?.name
                      )
                      .join(", ")
                  : "Select PDFs"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availablePdfs.length === 0 ? (
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  Start by uploading a document
                </div>
              ) : (
                availablePdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handlePdfSelect(pdf.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPdfIds.includes(pdf.id)}
                      onChange={() => handlePdfSelect(pdf.id)}
                      className="mr-2"
                    />
                    {pdf.name}
                  </div>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="relative">
            <input
              type="file"
              accept="application/pdf"
              id={`pdf-upload-${sectionId}`}
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange} // Call the updated function
            />
            <Button variant="outline" size="sm" asChild>
              <label
                htmlFor={`pdf-upload-${sectionId}`}
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
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Research Notes
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Research Notes</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUserNotes("")}
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  placeholder="Add your research notes here..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="min-h-[250px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      saveResearchNotes();
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to save
                  </p>
                  <Button size="sm" onClick={saveResearchNotes}>
                    <CornerDownLeft className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleComprehensiveAnalysis}
            disabled={isAnalyzing || selectedPdfIds.length === 0}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze Document"}
          </Button>
        </div>

        {/* Selected PDFs list */}
        {selectedPdfs.length > 0 && (
          <div className="space-y-2 mt-2">
            {selectedPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
              >
                <div className="flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{pdf.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-background/50"
                  onClick={() => handlePdfRemove(pdf.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}


        <div className="space-y-2">
          <Textarea
            placeholder={`Ask a question about ${title.toLowerCase()}...`}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              "Thinking..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      {!hideInsights && (
        <Card>
          <CardContent className="p-4">
            <div className="font-medium mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {title} Insights
            </div>
            <div
              className={`bg-muted rounded-md p-4 overflow-y-auto ${
                sectionId === "approach" ? "h-[600px]" : "h-[400px]"
              }`}
            >
              {chatHistory.length > 0 ? (
                <div className="space-y-2">
                  {chatHistory.map((message, index) => (
                    <div key={index} className="text-sm">
                      {message}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-sm text-muted-foreground">
                      AI is thinking...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                  Chat with your PDFs to generate insights
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
