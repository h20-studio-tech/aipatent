"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Confetti from "react-confetti";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import type { PDF } from "@/lib/types";
import { backendUrl } from "../config/config";
import type { Dispatch, SetStateAction } from "react"; // ✅ Fix missing import

interface SectionPanelProps {
  sectionId: string;
  title: string;
  pdfs: PDF[];
  onPdfUpload: (sectionId: string, file: File) => void;
  hideInsights?: boolean;
  chats: { role: "user" | "ai"; message: string }[];
  setChats: Dispatch<
    SetStateAction<{ role: "user" | "ai"; message: string }[]>
  >;
  selectedPdfIds: string[]; // ✅ Receive selected PDF IDs from parent
  setSelectedPdfIds: Dispatch<SetStateAction<string[]>>; // ✅ Function to update selected PDFs
  selectedPdfs: PDF[]; // ✅ Selected PDFs for this section
  setSelectedPdfs: Dispatch<SetStateAction<PDF[]>>; // ✅ Function to update selected PDFs
  pdfList: PDF[]; // ✅ All available PDFs
  setPdfList: Dispatch<SetStateAction<PDF[]>>; // ✅ Function to update PDF list
  setMetaData: Dispatch<
    SetStateAction<
      {
        chunk_id: Number;
        filename: string;
        page_number: Number;
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
  chats,
  setChats,
  setInsightResponse,
  setMetaData,
  pdfList,
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
  const confettiRef = useRef(null);
  const successIconRef = useRef(null);

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
            (pdf: PDF) => pdf.name === file.name
          );

          if (uploadedPdf) {
            setSelectedPdfIds((prev) => [...prev, uploadedPdf.id]); // ✅ Select the uploaded PDF
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
        setChats((prevChats: any) => [
          {
            id: 6,
            section: title,
            question: userInput,
            answer: data.message,
            timestamp: new Date(),
            saved: true,
          },
          ...prevChats,
        ]);

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
        ? prev.filter((id) => id !== pdfId) // Remove if already selected
        : [...prev, pdfId]; // Add if not selected
      return [...updatedIds]; // ✅ Ensure a new array is returned
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

  const availablePdfs = pdfList.filter(
    (pdf) => pdf.section === sectionId || !pdf.section
  );

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
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
            <h3 className="text-xl font-medium mb-2">Processing PDF</h3>
            <p className="text-muted-foreground mb-4">
              Extracting insights from{" "}
              <span className="font-medium">{processingFileName}</span>
            </p>
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div className="bg-primary h-2 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* PDF Processing Success - Full Screen with Confetti */}
      {processingComplete && (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
          {showConfetti && (
            <Confetti width={window.innerWidth} height={window.innerHeight} />
          )}
          <div className="text-center max-w-md mx-auto p-8 z-10">
            <div
              ref={successIconRef}
              className="rounded-full bg-green-100 p-3 w-20 h-20 flex items-center justify-center mx-auto mb-6 relative"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              PDF Processed Successfully
            </h3>
            <p className="text-muted-foreground mb-4">
              <span className="font-medium">{processingFileName}</span> is ready
              for use.
            </p>
            <p className="text-sm text-muted-foreground">
              You can now interact with this document.
            </p>
          </div>
        </div>
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
              {availablePdfs.map((pdf) => (
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
              ))}
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
