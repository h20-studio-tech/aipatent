"use client";

import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SectionPanel from "@/components/section-panel";
import ApproachInsights from "@/components/approach-insights";
import TechnologyInsights from "@/components/technology-insights";
import InnovationInsights from "@/components/innovation-insights";
import { Suspense } from "react";
import { mockPdfs } from "@/lib/mock-data";
import { Dispatch, SetStateAction } from "react";
import { PDF } from "@/lib/types";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";

type InsightsRef = {
  generateContent: () => void;
};

export default function KnowledgeCreation() {
  const [patentName, setPatentName] = useState<string | null>(null);
  const [patentId, setPatentId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setPatentName(params.get("patentName"));
      setPatentId(params.get("patentId"));
    }
  }, []);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [activeTab, setActiveTab] = useState("approach");
  const [question, setQuestion] = useState<string>("");
  const [innovationResponse, setInnovationResponse] = useState("");
  const [lastSavedApproach, setLastSavedApproach] = useState("");
  const [lastSavedTechnology, setLastSavedTechnology] = useState("");
  const [lastSavedInnovation, setLastSavedInnovation] = useState("");
  const [approachResponse, setApproachResponse] = useState("");

  const [technologyResponse, setTechnologyResponse] = useState("");
  const [approachmetaData, setApproachMetaData] = useState([]);
  const [innovationmetaData, setInnovationMetaData] = useState([]);
  const [technologymetaData, setTechnologyMetaData] = useState([]);
  const approachInsightsRef = useRef<InsightsRef | null>(null);
  const technologyInsightsRef = useRef<InsightsRef | null>(null);
  const innovationInsightsRef = useRef<InsightsRef | null>(null);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<PDF[]>([]);

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

  // Make the generateContent functions available globally for the demo
  // In a real app, we would use context or props for this
  if (typeof window !== "undefined") {
    window.generateApproachInsights = () => {
      if (
        approachInsightsRef.current &&
        approachInsightsRef.current.generateContent
      ) {
        approachInsightsRef.current.generateContent();
      }
    };
    window.generateTechnologyInsights = () => {
      if (
        technologyInsightsRef.current &&
        technologyInsightsRef.current.generateContent
      ) {
        technologyInsightsRef.current.generateContent();
      }
    };
    window.generateInnovationInsights = () => {
      if (
        innovationInsightsRef.current &&
        innovationInsightsRef.current.generateContent
      ) {
        innovationInsightsRef.current.generateContent();
      }
    };
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {patentName ? patentName : "Knowledge Creation"}
        </h1>
        <p className="text-muted-foreground">
          Synthesize knowledge from existing sources to craft a new patent
        </p>
      </div>

      {/* Tabs for different sections */}
      <Card>
        <CardHeader>
          <CardTitle>Research Sections</CardTitle>
          <CardDescription>
            Upload PDFs and chat with them to generate insights for your patent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="approach"
            className="w-full"
            onValueChange={(value) => setActiveTab(value)} // ✅ Ensure state updates on tab change
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approach">Approach</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
              <TabsTrigger value="innovation">Innovation</TabsTrigger>
            </TabsList>

            <TabsContent value="approach">
              <SectionPanel
                setQuestion={setQuestion}
                patentId={patentId}
                setMetaData={setApproachMetaData}
                setInsightResponse={setApproachResponse}
                sectionId="approach"
                title="Approach"
                pdfList={pdfs}
                setPdfList={setPdfs}
                selectedPdfIds={selectedPdfIds}
                setSelectedPdfIds={setSelectedPdfIds}
                selectedPdfs={selectedPdfs}
                setSelectedPdfs={setSelectedPdfs}
                pdfs={pdfs.filter(
                  (pdf) => pdf.section === "approach" || !pdf.section
                )}
                onPdfUpload={handlePdfUpload}
                hideInsights={true}
              />
            </TabsContent>

            <TabsContent value="technology">
              <SectionPanel
                setQuestion={setQuestion}
                patentId={patentId}
                setMetaData={setTechnologyMetaData}
                setInsightResponse={setTechnologyResponse}
                sectionId="technology"
                title="Technology"
                pdfList={pdfs}
                setPdfList={setPdfs}
                selectedPdfIds={selectedPdfIds}
                setSelectedPdfIds={setSelectedPdfIds}
                selectedPdfs={selectedPdfs}
                setSelectedPdfs={setSelectedPdfs}
                pdfs={pdfs.filter(
                  (pdf) => pdf.section === "technology" || !pdf.section
                )}
                onPdfUpload={handlePdfUpload}
                hideInsights={true}
              />
            </TabsContent>

            <TabsContent value="innovation">
              <SectionPanel
                setQuestion={setQuestion}
                patentId={patentId}
                setMetaData={setInnovationMetaData}
                setInsightResponse={setInnovationResponse}
                sectionId="innovation"
                title="Innovation"
                pdfList={pdfs}
                setPdfList={setPdfs}
                selectedPdfIds={selectedPdfIds}
                setSelectedPdfIds={setSelectedPdfIds}
                selectedPdfs={selectedPdfs}
                setSelectedPdfs={setSelectedPdfs}
                pdfs={pdfs.filter(
                  (pdf) => pdf.section === "innovation" || !pdf.section
                )}
                onPdfUpload={handlePdfUpload}
                hideInsights={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conditional Insights Section based on active tab */}
      {activeTab === "approach" && (
        <ApproachInsights
          patentId={patentId}
          response={approachResponse}
          question={question}
          metaData={approachmetaData}
          ref={approachInsightsRef}
          lastSaved={lastSavedApproach}
          setLastSaved={setLastSavedApproach}
        />
      )}
      {activeTab === "technology" && (
        <TechnologyInsights
          patentId={patentId}
          response={technologyResponse}
          question={question}
          metaData={technologymetaData}
          ref={technologyInsightsRef}
          lastSaved={lastSavedTechnology}
          setLastSaved={setLastSavedTechnology}
        />
      )}
      {activeTab === "innovation" && (
        <InnovationInsights
          patentId={patentId}
          response={innovationResponse}
          question={question}
          metaData={innovationmetaData}
          ref={innovationInsightsRef}
          lastSaved={lastSavedInnovation}
          setLastSaved={setLastSavedInnovation}
        />
      )}
    </div>
  );
}
