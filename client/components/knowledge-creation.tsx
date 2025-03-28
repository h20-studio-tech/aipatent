"use client";

import { useState, useRef } from "react";
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
import { mockPdfs } from "@/lib/mock-data";
import { Dispatch, SetStateAction } from "react";
import { PDF } from "@/lib/types";

interface KnowledgeCreationProps {
  chats: any[]; // ✅ Correctly defining props as an object
  setChats: Dispatch<SetStateAction<any[]>>;
  patentId: any;
}

export default function KnowledgeCreation({
  chats,
  setChats,
  patentId,
}: KnowledgeCreationProps) {
  const [pdfs, setPdfs] = useState(mockPdfs);
  const [activeTab, setActiveTab] = useState("approach");
  const [innovationResponse, setInnovationResponse] = useState("");
  const [approachResponse, setApproachResponse] = useState("");
  const [approachpdfList, setapproachPdfList] = useState<PDF[]>([]);
  const [selectedapproachPdfs, setSelectedapproachPdfs] = useState<PDF[]>([]);
  const [selectedapproachPdfIds, setSelectedapproachPdfIds] = useState<
    string[]
  >([]);
  const [innovationpdfList, setinnovationPdfList] = useState<PDF[]>([]);
  const [selectedinnovationPdfs, setSelectedinnovationPdfs] = useState<PDF[]>(
    []
  );
  const [selectedinnovationPdfIds, setSelectedinnovationPdfIds] = useState<
    string[]
  >([]);
  const [technologypdfList, settechnologyPdfList] = useState<PDF[]>([]);
  const [selectedtechnologyPdfs, setSelectedtechnologyPdfs] = useState<PDF[]>(
    []
  );
  const [selectedtechnologyPdfIds, setSelectedtechnologyPdfIds] = useState<
    string[]
  >([]);
  const [technologyResponse, setTechnologyResponse] = useState("");
  const [approachmetaData, setApproachMetaData] = useState([]);
  const [innovationmetaData, setInnovationMetaData] = useState([]);
  const [technologymetaData, setTechnologyMetaData] = useState([]);
  const approachInsightsRef = useRef(null);
  const technologyInsightsRef = useRef(null);
  const innovationInsightsRef = useRef(null);

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
          Knowledge Creation
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
                chats={chats}
                patentId={patentId}
                setChats={setChats}
                setMetaData={setApproachMetaData}
                setInsightResponse={setApproachResponse}
                sectionId="approach"
                title="Approach"
                pdfList={approachpdfList}
                setPdfList={setapproachPdfList}
                selectedPdfs={selectedapproachPdfs}
                setSelectedPdfs={setSelectedapproachPdfs}
                selectedPdfIds={selectedapproachPdfIds}
                setSelectedPdfIds={setSelectedapproachPdfIds}
                pdfs={pdfs.filter(
                  (pdf) => pdf.section === "approach" || !pdf.section
                )}
                onPdfUpload={handlePdfUpload}
                hideInsights={true}
              />
            </TabsContent>

            <TabsContent value="technology">
              <SectionPanel
                chats={chats}
                setChats={setChats}
                patentId={patentId}
                setMetaData={setTechnologyMetaData}
                setInsightResponse={setTechnologyResponse}
                sectionId="technology"
                title="Technology"
                pdfList={technologypdfList}
                setPdfList={settechnologyPdfList}
                selectedPdfs={selectedtechnologyPdfs}
                setSelectedPdfs={setSelectedtechnologyPdfs}
                selectedPdfIds={selectedtechnologyPdfIds}
                setSelectedPdfIds={setSelectedtechnologyPdfIds}
                pdfs={pdfs.filter(
                  (pdf) => pdf.section === "technology" || !pdf.section
                )}
                onPdfUpload={handlePdfUpload}
                hideInsights={true}
              />
            </TabsContent>

            <TabsContent value="innovation">
              <SectionPanel
                chats={chats}
                setChats={setChats}
                patentId={patentId}
                setMetaData={setInnovationMetaData}
                setInsightResponse={setInnovationResponse}
                sectionId="innovation"
                title="Innovation"
                pdfList={innovationpdfList}
                setPdfList={setinnovationPdfList}
                selectedPdfs={selectedinnovationPdfs}
                setSelectedPdfs={setSelectedinnovationPdfs}
                selectedPdfIds={selectedinnovationPdfIds}
                setSelectedPdfIds={setSelectedinnovationPdfIds}
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
          response={approachResponse}
          metaData={approachmetaData}
          ref={approachInsightsRef}
        />
      )}
      {activeTab === "technology" && (
        <TechnologyInsights
          response={technologyResponse}
          metaData={technologymetaData}
          ref={technologyInsightsRef}
        />
      )}
      {activeTab === "innovation" && (
        <InnovationInsights
          response={innovationResponse}
          metaData={innovationmetaData}
          ref={innovationInsightsRef}
        />
      )}
    </div>
  );
}
