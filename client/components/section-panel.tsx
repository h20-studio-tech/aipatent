"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Send, FileText, X, File } from "lucide-react";
import type { PDF } from "@/lib/types";
import { backendUrl } from "../config/config";
import type { Dispatch, SetStateAction } from "react"; // ✅ Fix missing import

interface SectionPanelProps {
  sectionId: string;
  title: string;
  pdfs: PDF[];
  onPdfUpload: (sectionId: string, file: File) => void;
  hideInsights?: boolean;
  chats: { role: "user" | "ai"; message: string }[]; // ✅ Updated chat structure
  setChats: Dispatch<
    SetStateAction<{ role: "user" | "ai"; message: string }[]>
  >; // ✅ Function to update chats
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
}: SectionPanelProps) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfList, setPdfList] = useState<PDF[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await axios.post(
          `${backendUrl}/v1/documents/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (error) {
      } finally {
      }
    }
  };

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
          ...prevChats,
          {
            id: 6,
            section: title,
            question: userInput,
            answer: data.message,
            timestamp: new Date(),
            saved: true,
          },
        ]);
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
    setSelectedPdfIds((prev) =>
      prev.includes(pdfId)
        ? prev.filter((id) => id !== pdfId)
        : [...prev, pdfId]
    );
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/v1/documents/`);

      if (data.response) {
        console.log("Fetched Documents:", data.response);
        setPdfList(data.response); // Store PDFs in state
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

  const selectedPdfs = pdfs.filter((pdf) => selectedPdfIds.includes(pdf.id));

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div
      className={`grid grid-cols-1 ${
        hideInsights ? "md:grid-cols-1" : "md:grid-cols-2"
      } gap-4 mt-4`}
    >
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
                className="cursor-pointer"
              >
                <FileUp className="h-4 w-4 mr-2" />
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
              "Processing..."
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
