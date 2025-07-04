"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  File,
  Library,
  Database,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Interface for embodiment objects
interface Embodiment {
  id: number;
  title: string;
  description: string;
  selected: boolean;
  confidence?: number;
  source?: string;
  category?: string;
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

// Mock data for embodiments - 8 embodiments per section
const mockEmbodiments = {
  summary: [
    {
      id: 1,
      title: "Embodiment #1",
      description:
        "The system comprises a scanner for digitizing documents. A processor is coupled to the scanner for processing the digitized documents. The memory stores instructions for the processor to execute. The display shows the processed document information to the user. A network interface allows for remote access to the processed documents.",
      selected: true,
      confidence: 0.92,
      source: "US10891948 - Voice Control System.pdf",
      summary:
        "A document digitization system with processing, storage, display and remote access capabilities.",
    },
    {
      id: 2,
      title: "Embodiment #2",
      description:
        "The method includes receiving a scanned document from an input device. Text is extracted from the document using optical character recognition. The extracted text is processed to identify key sections and information. The processed information is stored in a structured database. The information can be retrieved and displayed based on user queries.",
      selected: true,
      confidence: 0.88,
      source: "US11234567 - Touchscreen Interface Method.pdf",
    },
    {
      id: 3,
      title: "Embodiment #3",
      description:
        "The user interface displays document sections in a hierarchical structure. Users can navigate through different sections using a sidebar menu. Document text is displayed in the main panel with highlighted key terms. Search functionality allows users to find specific information quickly. Annotations can be added to specific sections of the document.",
      selected: true,
      confidence: 0.95,
      source: "US9876543 - Wireless Communication Protocol.pdf",
    },
    {
      id: 4,
      title: "Embodiment #4",
      description:
        "The data extraction module identifies tables within the document. Table data is converted into a structured format for analysis. Graphs and charts are recognized and their data points extracted. Mathematical formulas are parsed and stored in a machine-readable format. References and citations are linked to their original sources.",
      selected: true,
      confidence: 0.89,
      source: "US10891948 - Voice Control System.pdf",
    },
    {
      id: 5,
      title: "Embodiment #5",
      description:
        "The document classification system categorizes documents based on content analysis. Machine learning algorithms identify document types and subject matter. Documents are automatically tagged with relevant metadata. Similar documents are grouped together for easier retrieval. Classification accuracy improves over time through user feedback.",
      selected: true,
      confidence: 0.91,
      source: "US11234567 - Touchscreen Interface Method.pdf",
    },
    {
      id: 6,
      title: "Embodiment #6",
      description:
        "The version control system maintains document history and revisions. Changes are tracked with timestamps and user information. Previous versions can be restored if needed. Differences between versions are highlighted for easy comparison. Branching allows for parallel document development paths.",
      selected: true,
      confidence: 0.87,
      source: "US9876543 - Wireless Communication Protocol.pdf",
    },
    {
      id: 7,
      title: "Embodiment #7",
      description:
        "The document sharing module enables controlled distribution of documents. Access permissions can be set at the document or section level. Watermarking identifies the source and recipient of shared documents. Usage analytics track document views and interactions. Expiration dates can be set to automatically revoke access.",
      selected: true,
      confidence: 0.93,
      source: "US10891948 - Voice Control System.pdf",
    },
    {
      id: 8,
      title: "Embodiment #8",
      description:
        "The reporting system generates insights from document usage patterns. Dashboards display key metrics on document creation and access. Trend analysis identifies popular document types and content. User activity reports show engagement levels. Custom reports can be configured for specific business needs.",
      selected: true,
      confidence: 0.9,
      source: "US11234567 - Touchscreen Interface Method.pdf",
    },
  ],
  description: [
    {
      id: 9,
      title: "Embodiment #1",
      description:
        "The document processing system includes a cloud-based storage solution that automatically backs up all processed documents. Version control tracks changes to documents over time. Collaborative editing features allow multiple users to work on the same document simultaneously. Changes are merged in real-time with conflict resolution algorithms.",
      selected: true,
      confidence: 0.94,
      source: "US9876543 - Wireless Communication Protocol.pdf",
      category: "disease rationale",
      summary:
        "A cloud-based document system with version control and real-time collaborative editing.",
      header: "Document Management Systems",
    },
    {
      id: 10,
      title: "Embodiment #2",
      description:
        "The security module implements multi-factor authentication for accessing sensitive documents. Encryption is applied to documents both in transit and at rest. Access control lists define user permissions at the document and section levels. Audit logs track all document access and modifications for compliance purposes.",
      selected: true,
      confidence: 0.89,
      source: "US10891948 - Voice Control System.pdf",
      category: "disease rationale",
      header: "Document Management Systems",
    },
    {
      id: 11,
      title: "Embodiment #3",
      description:
        "The mobile application provides access to documents on smartphones and tablets. Responsive design adapts the interface to different screen sizes. Offline mode allows users to download documents for access without internet connectivity. Changes made offline are synchronized when connectivity is restored.",
      selected: true,
      confidence: 0.92,
      source: "US11234567 - Touchscreen Interface Method.pdf",
      category: "disease rationale",
      header: "Mobile Applications",
    },
    {
      id: 12,
      title: "Embodiment #4",
      description:
        "The AI-powered assistant analyzes document content to provide contextual recommendations. Similar documents are suggested based on content similarity. Important deadlines mentioned in documents are automatically extracted and added to calendar reminders. Key entities such as people, organizations, and locations are identified and indexed.",
      selected: true,
      confidence: 0.96,
      source: "US9876543 - Wireless Communication Protocol.pdf",
      category: "disease rationale",
      header: "AI Assistants",
    },
    {
      id: 13,
      title: "Embodiment #5",
      description:
        "The document workflow engine automates business processes involving document handling. Customizable workflows define document routing and approval steps. Notifications alert users when action is required. Escalation rules handle overdue tasks. Analytics provide insights into process efficiency and bottlenecks.",
      selected: true,
      confidence: 0.91,
      source: "US10891948 - Voice Control System.pdf",
      category: "product composition",
      header: "Workflow Automation",
    },
    {
      id: 14,
      title: "Embodiment #6",
      description:
        "The integration framework connects the document system with external applications. APIs enable programmatic access to document functions. Pre-built connectors support common business systems. Webhook support allows for event-driven integration. Custom data mappings transform information between systems.",
      selected: true,
      confidence: 0.88,
      source: "US11234567 - Touchscreen Interface Method.pdf",
      category: "product composition",
      header: "System Integration",
    },
    {
      id: 15,
      title: "Embodiment #7",
      description:
        "The compliance management module ensures documents adhere to regulatory requirements. Policy templates enforce standardized document structures. Retention policies automatically archive or delete documents after specified periods. Compliance reports demonstrate adherence to regulations. Audit trails provide evidence for regulatory inspections.",
      selected: true,
      confidence: 0.93,
      source: "US9876543 - Wireless Communication Protocol.pdf",
      category: "product composition",
      header: "Compliance Management",
    },
    {
      id: 16,
      title: "Embodiment #8",
      description:
        "The document template system standardizes content creation. Templates include predefined sections and formatting. Dynamic fields auto-populate with relevant information. Approval workflows ensure templates meet organizational standards. Usage analytics track template adoption and effectiveness.",
      selected: true,
      confidence: 0.9,
      source: "US10891948 - Voice Control System.pdf",
      category: "product composition",
      header: "Document Templates",
    },
  ],
  claims: [
    {
      id: 17,
      title: "Embodiment #1",
      description:
        "A method for automated document classification comprising: receiving a document; extracting text features using natural language processing; applying a machine learning classifier to categorize the document; assigning metadata tags based on the classification; and storing the document with its classification information in a searchable database.",
      selected: true,
      confidence: 0.95,
      source: "US11234567 - Touchscreen Interface Method.pdf",
      summary:
        "An automated document classification method using NLP and machine learning.",
    },
    {
      id: 18,
      title: "Embodiment #2",
      description:
        "A system for document workflow automation comprising: a document intake module; a processing pipeline with configurable stages; a rules engine for routing documents based on content; a notification system for alerting users of required actions; and a reporting dashboard for tracking document status and system performance metrics.",
      selected: true,
      confidence: 0.92,
      source: "US9876543 - Wireless Communication Protocol.pdf",
    },
    {
      id: 19,
      title: "Embodiment #3",
      description:
        "An apparatus for secure document sharing comprising: an encryption module using industry-standard protocols; a key management system for controlling access; a permissions layer that allows granular control over document actions; a watermarking feature that embeds tracking information; and an expiration mechanism that can revoke access after a specified time period.",
      selected: true,
      confidence: 0.89,
      source: "US10891948 - Voice Control System.pdf",
    },
    {
      id: 20,
      title: "Embodiment #4",
      description:
        "A method for intelligent document summarization comprising: analyzing document structure to identify sections; extracting key sentences using importance scoring algorithms; generating abstractive summaries using natural language generation; adapting summary length based on user preferences; and providing interactive expansion of summary sections for additional detail.",
      selected: true,
      confidence: 0.94,
      source: "US11234567 - Touchscreen Interface Method.pdf",
    },
    {
      id: 21,
      title: "Embodiment #5",
      description:
        "A system for document version control comprising: a storage mechanism that maintains multiple document versions; a differencing engine that identifies changes between versions; a merge component that combines changes from multiple sources; a conflict resolution module that handles competing edits; and a rollback feature that restores previous document states.",
      selected: true,
      confidence: 0.91,
      source: "US9876543 - Wireless Communication Protocol.pdf",
    },
    {
      id: 22,
      title: "Embodiment #6",
      description:
        "A method for automated document compliance checking comprising: scanning document content against regulatory requirements; identifying non-compliant sections or missing elements; suggesting corrections to achieve compliance; generating compliance reports for audit purposes; and maintaining a history of compliance status changes over time.",
      selected: true,
      confidence: 0.88,
      source: "US10891948 - Voice Control System.pdf",
    },
    {
      id: 23,
      title: "Embodiment #7",
      description:
        "A system for document analytics comprising: tracking mechanisms for document usage patterns; visualization tools for presenting usage metrics; anomaly detection for identifying unusual access patterns; predictive models for forecasting document lifecycle events; and recommendation engines for suggesting relevant documents to users.",
      selected: true,
      confidence: 0.93,
      source: "US11234567 - Touchscreen Interface Method.pdf",
    },
    {
      id: 24,
      title: "Embodiment #8",
      description:
        "A method for document-based knowledge extraction comprising: identifying key concepts within document collections; establishing relationships between concepts across documents; constructing knowledge graphs from extracted information; enabling natural language queries against the knowledge base; and continuously updating the knowledge model as new documents are processed.",
      selected: true,
      confidence: 0.9,
      source: "US9876543 - Wireless Communication Protocol.pdf",
    },
  ],
};

// Mock data for key terms glossary
const keyTerms = [
  {
    id: "term-1",
    term: "Document Processing System",
    definition:
      "A comprehensive software solution designed to manage the entire lifecycle of digital documents, including creation, storage, retrieval, modification, and distribution.",
  },
  {
    id: "term-2",
    term: "Cloud-based Storage",
    definition:
      "A model of data storage where digital information is stored in logical pools across multiple servers, typically hosted by a third-party service provider and accessed via the internet.",
  },
  {
    id: "term-3",
    term: "Version Control",
    definition:
      "A system that records changes to files over time so that specific versions can be recalled later, enabling tracking of modifications and collaborative editing.",
  },
  {
    id: "term-4",
    term: "Multi-factor Authentication",
    definition:
      "A security process that requires users to provide two or more verification factors to gain access to a resource, typically combining something they know (password) with something they have (security token) or something they are (biometric).",
  },
  {
    id: "term-5",
    term: "Collaborative Editing",
    definition:
      "A feature that allows multiple users to edit a document simultaneously, with changes synchronized in real-time across all participants' views.",
  },
  {
    id: "term-6",
    term: "Conflict Resolution Algorithm",
    definition:
      "A computational method used to automatically resolve contradictory changes made by different users to the same document, ensuring data consistency.",
  },
  {
    id: "term-7",
    term: "API (Application Programming Interface)",
    definition:
      "A set of rules and protocols that allows different software applications to communicate with each other, enabling integration between systems.",
  },
  {
    id: "term-8",
    term: "Webhook",
    definition:
      "A mechanism that allows one application to provide other applications with real-time information by sending HTTP POST requests to a specified URL when certain events occur.",
  },
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const mockRawData = {
  abstract: `[RAW PATENT TEXT - ABSTRACT]\n\nAn invention is disclosed for a system and method for immunoglobulin Y (IgY) antibody extraction from avian sources, specifically chicken egg yolks. The method improves extraction efficiency and antibody stability. The invention includes novel purification protocols that maintain the structural integrity and biological activity of IgY antibodies. The system comprises an automated extraction apparatus, purification columns, and quality control mechanisms. Applications include therapeutic treatments, diagnostic assays, and research.`,
  keyTerms: `[RAW PATENT TEXT - DEFINITIONS SECTION]\n\n1.1 Document Processing System: A software solution for managing the lifecycle of digital documents.\n1.2 Cloud-based Storage: A model of data storage where digital information is stored in logical pools across multiple servers.\n1.3 Version Control: A system that records changes to files over time.\n1.4 Multi-factor Authentication: A security process that requires users to provide two or more verification factors to gain access to a resource, typically combining something they know (password) with something they have (security token) or something they are (biometric).`,
  summary: `[RAW PATENT TEXT - SUMMARY OF INVENTION]\n\nThe invention provides for a manufacturing system for electronic devices. The system is designed to enhance durability and reduce environmental impact. It addresses challenges in modern electronics manufacturing. The system includes a modular assembly process, energy-efficient techniques, and novel material compositions. The advantages include reduced production costs, extended product lifespan, and improved customer satisfaction. The invention relates to methods and systems for extracting, purifying, and utilizing immunoglobulin Y (IgY) antibodies from avian sources, particularly chicken egg yolks. The disclosed methods provide improved extraction efficiency and antibody stability compared to conventional techniques.`,
  description: `[RAW PATENT TEXT - DETAILED DESCRIPTION - OVERVIEW]\n\nFIG. 1 shows a block diagram of the electronic device manufacturing system (100). The system comprises a material processing subsystem (110), a component assembly subsystem (120), and a quality control subsystem (130). The material processing subsystem (110) handles the preparation of raw materials. The component assembly subsystem (120) manages the precision assembly of electronic components. The quality control subsystem (130) implements automated inspection and testing. The security module implements multi-factor authentication for accessing sensitive documents. Encryption is applied to documents both in transit and at rest. Access control lists define user permissions at the document and section levels. Audit logs track all document access and modifications for compliance purposes.`,
  claims: `[RAW PATENT TEXT - CLAIMS]\n\nWhat is claimed is:\n1. A system for manufacturing electronic devices, comprising: a material processing subsystem configured to prepare and allocate materials with precision control; a component assembly subsystem configured to assemble electronic components with adaptive positioning; and a quality control subsystem configured to detect manufacturing defects using multi-spectral imaging.\n2. The system of claim 1, wherein the material processing subsystem is further configured to incorporate recycled materials.\n3. A method for automated document classification comprising: receiving a document; extracting text features using natural language processing; applying a machine learning classifier to categorize the document; assigning metadata tags based on the classification; and storing the document with its classification information in a searchable database.`,

  [`description_header_${slugify(
    "Document Management Systems"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - DOCUMENT MANAGEMENT SYSTEMS]\n\nThis subsection elaborates on the various embodiments related to document management systems. It covers aspects like cloud-based storage, version control, collaborative editing, and security features such as multi-factor authentication and encryption. The focus is on systems that ensure efficient and secure handling of documents throughout their lifecycle.`,
  [`description_category_${slugify("Document Management Systems")}-${slugify(
    "disease rationale"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - DOCUMENT MANAGEMENT SYSTEMS - DISEASE RATIONALE]\n\nSpecific embodiments under this category within Document Management Systems specifically address the rationale behind certain design choices or functionalities as they pertain to disease-related information management or similar critical applications. This includes ensuring data integrity, traceability, and secure access for sensitive information.`,

  [`description_header_${slugify(
    "Mobile Applications"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - MOBILE APPLICATIONS]\n\nThis part of the detailed description focuses on embodiments related to mobile applications for document access. Key features include responsive design for various screen sizes, offline access capabilities, and synchronization mechanisms for changes made while offline. The aim is to provide seamless document interaction on mobile devices.`,
  [`description_category_${slugify("Mobile Applications")}-${slugify(
    "disease rationale"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - MOBILE APPLICATIONS - DISEASE RATIONALE]\n\nWithin mobile applications, these embodiments highlight the importance of secure and reliable access to potentially critical information (e.g., related to disease management or patient data) on the go. This includes considerations for data privacy and usability in mobile contexts.`,

  [`description_header_${slugify(
    "AI Assistants"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - AI ASSISTANTS]\n\nThis subsection describes embodiments involving AI-powered assistants integrated into the document system. These assistants analyze document content to provide contextual recommendations, suggest similar documents, extract key information like deadlines, and identify important entities.`,
  [`description_category_${slugify("AI Assistants")}-${slugify(
    "disease rationale"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - AI ASSISTANTS - DISEASE RATIONALE]\n\nAI assistants in this context are detailed for their role in processing and understanding complex information, such as medical texts or research papers. The rationale focuses on improving comprehension, speeding up research, and aiding in decision-making by highlighting relevant data points.`,

  [`description_header_${slugify(
    "Workflow Automation"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - WORKFLOW AUTOMATION]\n\nEmbodiments concerning document workflow automation are detailed here. This includes engines that automate business processes involving document handling, customizable workflows for routing and approval, notification systems, and analytics for process efficiency.`,
  [`description_category_${slugify("Workflow Automation")}-${slugify(
    "product composition"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - WORKFLOW AUTOMATION - PRODUCT COMPOSITION]\n\nThese embodiments describe the structural components and features of workflow automation systems. This includes the design of the workflow engine, the rule-based systems for routing, and the mechanisms for notifications and escalations, forming the core product composition for automated document processes.`,

  [`description_header_${slugify(
    "System Integration"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - SYSTEM INTEGRATION]\n\nThis section covers the integration framework that connects the document system with other external applications. It discusses APIs, pre-built connectors for common business systems, webhook support for event-driven integration, and custom data mappings.`,
  [`description_category_${slugify("System Integration")}-${slugify(
    "product composition"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - SYSTEM INTEGRATION - PRODUCT COMPOSITION]\n\nHere, the focus is on the components that enable system integration, such as the API architecture, the design of connectors, and the data transformation tools. These elements constitute the product's ability to interoperate with other software.`,

  [`description_header_${slugify(
    "Compliance Management"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - COMPLIANCE MANAGEMENT]\n\nEmbodiments related to compliance management are described, ensuring documents adhere to regulatory requirements. This includes policy templates, retention policies, compliance reporting, and audit trails.`,
  [`description_category_${slugify("Compliance Management")}-${slugify(
    "product composition"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - COMPLIANCE MANAGEMENT - PRODUCT COMPOSITION]\n\nThis details the features and modules designed for compliance, such as the policy enforcement engine, automated archiving/deletion mechanisms based on retention rules, and the generation of compliance reports. These are key parts of the product's compliance capabilities.`,

  [`description_header_${slugify(
    "Document Templates"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - DOCUMENT TEMPLATES]\n\nThis subsection details the document template system for standardizing content creation. It covers templates with predefined sections, dynamic fields, approval workflows for templates, and analytics on template usage.`,
  [`description_category_${slugify("Document Templates")}-${slugify(
    "product composition"
  )}`]: `[RAW PATENT TEXT - DETAILED DESCRIPTION - DOCUMENT TEMPLATES - PRODUCT COMPOSITION]\n\nEmbodiments here describe the structure of the template system itself: how templates are created, stored, and managed; how dynamic fields are implemented; and how versioning or approval for templates works. This forms the product features for template management.`,
};

const combinedRawData = Object.entries(mockRawData)
  .map(
    ([key, value]) =>
      `----------\n\n[ ${key
        .replace(/_/g, " ")
        .toUpperCase()} ]\n\n----------\n\n${value}`
  )
  .join("\n\n\n");

export default function Home() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [showResearchSections, setShowResearchSections] = useState(false);
  const [selectedPatents, setSelectedPatents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [embodiments, setEmbodiments] = useState(mockEmbodiments);
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmbodiment, setEditingEmbodiment] =
    useState<RemixedEmbodiment | null>(null);

  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [selectedMetadataEmbodiment, setSelectedMetadataEmbodiment] = useState<
    Embodiment | RemixedEmbodiment | null
  >(null);
  const [metadataType, setMetadataType] = useState<"extracted" | "remixed">(
    "extracted"
  );
  const initialVisibleSummaries = Object.values(mockEmbodiments).reduce(
    (acc, section) => {
      section.forEach((embodiment) => {
        if (embodiment.summary) {
          acc[embodiment.id] = true;
        }
      });
      return acc;
    },
    {} as Record<number, boolean>
  );

  const [visibleSummaries, setVisibleSummaries] = useState<
    Record<number, boolean>
  >(initialVisibleSummaries);
  const [showKeyTerms, setShowKeyTerms] = useState(true);
  const [showAbstract, setShowAbstract] = useState(true);

  const [availablePdfs, setAvailablePdfs] = useState<PdfFile[]>([
    {
      id: "pdf1",
      name: "IgY_Extraction_Methods_Patent_US10567890.pdf",
      selected: false,
      size: "2.4 MB",
      uploadDate: "2025-03-15",
    },
    {
      id: "pdf2",
      name: "IgY_Antibody_Production_Patent_US11234567.pdf",
      selected: false,
      size: "1.1 MB",
      uploadDate: "2025-03-20",
    },
    {
      id: "pdf3",
      name: "IgY_Therapeutic_Applications_Patent_EP3456789.pdf",
      selected: false,
      size: "3.7 MB",
      uploadDate: "2025-03-25",
    },
    {
      id: "pdf4",
      name: "IgY_Diagnostic_Methods_Patent_US9876543.pdf",
      selected: false,
      size: "0.9 MB",
      uploadDate: "2025-03-30",
    },
  ]);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);

  const [filterQuery, setFilterQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "date" | "size">("name");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "extract" | "review" | "create"
  >("upload");

  const [activeSection, setActiveSection] = useState("abstract");

  const [showSummaryOfInvention, setShowSummaryOfInvention] = useState(true);
  const [showDetailedDescription, setShowDetailedDescription] = useState(true);
  const [showClaims, setShowClaims] = useState(true);

  const [showRawDataModal, setShowRawDataModal] = useState(false);
  const [rawDataContent, setRawDataContent] = useState({
    title: "",
    content: "",
  });

  const [tocCollapsed, setTocCollapsed] = useState(false);

  const [showSplitScreen, setShowSplitScreen] = useState(false);
  const [sourcesPanelCollapsed, setSourcesPanelCollapsed] = useState(false);
  const [splitScreenContent, setSplitScreenContent] = useState({
    title: "All Sources",
    content: combinedRawData,
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

  const toggleAndScroll = (
    sectionId: string,
    currentShowState: boolean,
    setShowState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setShowState(!currentShowState);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50); // Delay to allow DOM update for smooth scroll
  };

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

  const handleExtractEmbodiments = () => {
    setIsExtracting(true);
    setCurrentStep("extract");
    setProcessingProgress(0);
  };

  const handleRemovePatent = (patent: string) => {
    setSelectedPatents(selectedPatents.filter((p) => p !== patent));
    setAvailablePdfs((pdfs) =>
      pdfs.map((pdf) =>
        pdf.name === patent ? { ...pdf, selected: false } : pdf
      )
    );
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

  const findEmbodimentById = (id: number): Embodiment | null => {
    for (const section of Object.values(embodiments)) {
      const found = section.find((e) => e.id === id);
      if (found) return found;
    }
    return null;
  };

  const findRemixedEmbodimentById = (id: number): RemixedEmbodiment | null => {
    return remixedEmbodiments.find((e) => e.id === id) || null;
  };

  const createRemixedEmbodiment = (
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

    setTimeout(() => {
      let remixedDescription = "";
      if (similarityPercentage === 25) {
        remixedDescription = `This enhanced version significantly expands upon the original concept. While maintaining the core functionality of ${originalEmbodiment.title.toLowerCase()}, this implementation introduces advanced machine learning algorithms for improved accuracy. The system now features real-time processing capabilities and integrates with external data sources. User experience has been completely redesigned with accessibility as a primary focus. Cloud-based deployment enables scalability across enterprise environments.`;
      } else if (similarityPercentage === 50) {
        remixedDescription = `Building upon ${originalEmbodiment.title.toLowerCase()}, this variation maintains several key elements while introducing important innovations. ${
          originalEmbodiment.description.split(".")[0]
        }. However, this implementation adds automated data validation and error correction mechanisms. Processing efficiency has been improved through parallel computing techniques. The user interface now includes customizable dashboards and reporting tools.`;
      } else if (similarityPercentage === 75) {
        remixedDescription = `This iteration closely follows the approach of ${originalEmbodiment.title.toLowerCase()} with targeted enhancements. ${originalEmbodiment.description
          .split(".")
          .slice(0, 3)
          .join(
            "."
          )}. The primary improvements include optimized performance for large-scale data processing, enhanced security protocols, and additional export options for greater interoperability with third-party systems.`;
      } else {
        remixedDescription = `${originalEmbodiment.description} This implementation refines the original concept with minor optimizations for performance and usability while maintaining complete functional parity.`;
      }

      const newRemixedEmbodiment: RemixedEmbodiment = {
        id: Date.now(),
        originalId,
        title: `Remixed ${originalEmbodiment.title}`,
        description: remixedDescription,
        similarityPercentage,
        createdAt: new Date().toISOString(),
      };
      setRemixedEmbodiments((prev) => [...prev, newRemixedEmbodiment]);
      setIsCreatingRemix(false);
    }, 1500);
  };

  const saveEmbodiment = (
    embodiment: Embodiment | RemixedEmbodiment,
    source: string
  ) => {
    let section = activeTab;
    if (source === "remixed") {
      const originalEmbodiment = findEmbodimentById(
        (embodiment as RemixedEmbodiment).originalId
      );
      if (originalEmbodiment) {
        for (const [key, value] of Object.entries(embodiments)) {
          if (value.some((e) => e.id === originalEmbodiment.id)) {
            section = key;
            break;
          }
        }
      }
    }

    const newStoredKnowledge: StoredKnowledge = {
      id: Date.now(),
      title: embodiment.title,
      description: embodiment.description,
      source: source,
      section:
        section === "summary"
          ? "Summary of Invention"
          : section === "description"
          ? "Detailed Description"
          : "Claims",
      savedAt: new Date().toISOString(),
    };
    setStoredKnowledge((prev) => [...prev, newStoredKnowledge]);
    toast({
      title: "Embodiment saved",
      description: "The embodiment has been added to your stored knowledge.",
      duration: 3000,
    });
  };

  const startEditing = (embodiment: RemixedEmbodiment) => {
    setEditingEmbodiment(embodiment);
    setEditingText(embodiment.description);
    setEditDialogOpen(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

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

  const regenerateEmbodiment = (embodiment: RemixedEmbodiment) => {
    setIsCreatingRemix(true);
    setTimeout(() => {
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

  const showExtractedMetadata = (embodiment: Embodiment) => {
    setSelectedMetadataEmbodiment(embodiment);
    setMetadataType("extracted");
    setShowMetadataDialog(true);
  };

  const showRemixedMetadata = (embodiment: RemixedEmbodiment) => {
    setSelectedMetadataEmbodiment(embodiment);
    setMetadataType("remixed");
    setShowMetadataDialog(true);
  };

  const togglePdfSelection = (id: string) => {
    setAvailablePdfs((pdfs) =>
      pdfs.map((pdf) =>
        pdf.id === id ? { ...pdf, selected: !pdf.selected } : pdf
      )
    );
    const updatedPdf = availablePdfs.find((pdf) => pdf.id === id);
    if (updatedPdf) {
      if (updatedPdf.selected) {
        setSelectedPatents((prev) =>
          prev.filter((name) => name !== updatedPdf.name)
        );
      } else {
        setSelectedPatents((prev) => [...prev, updatedPdf.name]);
      }
    }
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredPdfs = availablePdfs;

  const toggleSummary = (embodimentId: number) => {
    setVisibleSummaries((prev) => ({
      ...prev,
      [embodimentId]: !prev[embodimentId],
    }));
  };

  const tableOfContents = [
    { id: "abstract", title: "Abstract", level: 1 },
    { id: "key-terms", title: "Key Terms", level: 1 },
    { id: "summary-of-invention", title: "Summary of Invention", level: 1 },
    { id: "detailed-description", title: "Detailed Description", level: 1 },
    { id: "claims", title: "Claims", level: 1 },
    ...(remixedEmbodiments.length > 0
      ? [{ id: "new-embodiments", title: "New Embodiments", level: 1 }]
      : []),
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
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

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Original Data (Split Screen) */}
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

      {/* Center Panel - Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="container mx-auto px-4 py-8 relative">
          <Button
            variant="outline"
            className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-transparent"
            onClick={() => setShowStoredKnowledge(true)}
          >
            <Database className="h-4 w-4" />
            Stored Knowledge
          </Button>

          <Button
            variant="default"
            size="lg"
            className="absolute top-4 right-4 z-10"
          >
            Next
          </Button>

          {/* All the main page content (Patent Docs, Embodiments, etc.) */}
          <div className="border rounded-lg p-6 shadow-sm mb-8 mt-16">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Patent Documents</h2>
              <p className="text-sm text-muted-foreground">
                Upload new patents or select from your previously uploaded
                documents
              </p>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Library className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Select or Upload Patents</h3>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
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

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    id="pdf-upload"
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                    asChild
                  >
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      <File className="h-4 w-4" />
                      Upload PDF
                    </label>
                  </Button>
                </div>
              </div>
            </div>

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
                        <X className="h-4 w-4" />
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
                disabled={isExtracting || selectedPatents.length === 0}
              >
                <Sparkles className="h-5 w-5" />
                Extract Embodiments
              </Button>
            </div>
          </div>

          {isExtracting && (
            <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8 bg-background rounded-lg shadow-2xl">
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
                  This process may take a few moments as we identify and
                  categorize all embodiments in your patents.
                </p>
              </div>
            </div>
          )}

          {isCreatingRemix && (
            <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8 bg-background rounded-lg shadow-2xl">
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
                  <div className="group relative border-l-4 border-primary pl-4 mb-6 flex justify-between items-center">
                    <div
                      className="cursor-pointer flex-grow"
                      onClick={() =>
                        toggleAndScroll(
                          "abstract",
                          showAbstract,
                          setShowAbstract
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleAndScroll(
                            "abstract",
                            showAbstract,
                            setShowAbstract
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showAbstract}
                      aria-controls="abstract-content"
                    >
                      <h3 className="text-2xl font-bold text-primary">
                        Abstract
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patent abstract and overview
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOriginal("Abstract", mockRawData.abstract);
                        }}
                      >
                        View Original
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAndScroll(
                            "abstract",
                            showAbstract,
                            setShowAbstract
                          )
                        }
                        aria-label={
                          showAbstract ? "Collapse Abstract" : "Expand Abstract"
                        }
                        aria-expanded={showAbstract}
                        aria-controls="abstract-content"
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
                    <div
                      id="abstract-content"
                      className="border rounded-lg p-6 bg-gray-50 shadow-sm"
                    >
                      <div className="space-y-4 text-sm text-gray-700">
                        <p>
                          The present invention relates to methods and systems
                          for extracting, purifying, and utilizing
                          immunoglobulin Y (IgY) antibodies from avian sources,
                          particularly chicken egg yolks. The disclosed methods
                          provide improved extraction efficiency and antibody
                          stability compared to conventional techniques.
                        </p>
                        <p>
                          The invention encompasses novel purification protocols
                          that maintain the structural integrity and biological
                          activity of IgY antibodies while reducing processing
                          time and costs. The system includes automated
                          extraction apparatus, purification columns, and
                          quality control mechanisms for ensuring consistent
                          antibody yield and purity.
                        </p>
                        <p>
                          Applications of the extracted IgY antibodies include
                          therapeutic treatments, diagnostic assays, and
                          research applications. The invention provides a
                          scalable platform for commercial production of
                          high-quality IgY antibodies with enhanced stability
                          and extended shelf life.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  id="key-terms"
                  data-section-id="key-terms"
                  className="mb-12 pt-4"
                >
                  <div className="group relative border-l-4 border-primary pl-4 mb-6 flex justify-between items-center">
                    <div
                      className="cursor-pointer flex-grow"
                      onClick={() =>
                        toggleAndScroll(
                          "key-terms",
                          showKeyTerms,
                          setShowKeyTerms
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleAndScroll(
                            "key-terms",
                            showKeyTerms,
                            setShowKeyTerms
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showKeyTerms}
                      aria-controls="key-terms-content"
                    >
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
                          handleViewOriginal("Key Terms", mockRawData.keyTerms);
                        }}
                      >
                        View Original
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAndScroll(
                            "key-terms",
                            showKeyTerms,
                            setShowKeyTerms
                          )
                        }
                        aria-label={
                          showKeyTerms
                            ? "Collapse Key Terms"
                            : "Expand Key Terms"
                        }
                        aria-expanded={showKeyTerms}
                        aria-controls="key-terms-content"
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
                    <div
                      id="key-terms-content"
                      className="border rounded-md p-4 space-y-4 bg-gray-50 shadow-sm"
                    >
                      {keyTerms.map((item) => (
                        <div
                          key={item.id}
                          className="border-b pb-2 last:border-b-0 last:pb-0"
                        >
                          <h4 className="font-medium text-gray-700">
                            {item.term}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  id="summary-of-invention"
                  data-section-id="summary-of-invention"
                  className="mb-12 pt-4"
                >
                  <div className="group relative border-l-4 border-primary pl-4 mb-6 flex justify-between items-center">
                    <div
                      className="cursor-pointer flex-grow"
                      onClick={() =>
                        toggleAndScroll(
                          "summary-of-invention",
                          showSummaryOfInvention,
                          setShowSummaryOfInvention
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleAndScroll(
                            "summary-of-invention",
                            showSummaryOfInvention,
                            setShowSummaryOfInvention
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showSummaryOfInvention}
                      aria-controls="summary-of-invention-content"
                    >
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
                            mockRawData.summary
                          );
                        }}
                      >
                        View Original
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAndScroll(
                            "summary-of-invention",
                            showSummaryOfInvention,
                            setShowSummaryOfInvention
                          )
                        }
                        aria-label={
                          showSummaryOfInvention
                            ? "Collapse Summary of Invention"
                            : "Expand Summary of Invention"
                        }
                        aria-expanded={showSummaryOfInvention}
                        aria-controls="summary-of-invention-content"
                      >
                        {showSummaryOfInvention ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {showSummaryOfInvention && (
                    <div id="summary-of-invention-content">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {embodiments.summary.map((embodiment) => (
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
                            <p className="text-sm">{embodiment.description}</p>
                            <div className="mt-3 flex justify-between items-center">
                              <Badge variant="outline" className="text-xs">
                                Source: {embodiment.source}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  id="detailed-description"
                  data-section-id="detailed-description"
                  className="mb-12 pt-4"
                >
                  <div className="group relative border-l-4 border-primary pl-4 mb-6 flex justify-between items-center">
                    <div
                      className="cursor-pointer flex-grow"
                      onClick={() =>
                        toggleAndScroll(
                          "detailed-description",
                          showDetailedDescription,
                          setShowDetailedDescription
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleAndScroll(
                            "detailed-description",
                            showDetailedDescription,
                            setShowDetailedDescription
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showDetailedDescription}
                      aria-controls="detailed-description-content"
                    >
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
                            mockRawData.description
                          );
                        }}
                      >
                        View Original
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAndScroll(
                            "detailed-description",
                            showDetailedDescription,
                            setShowDetailedDescription
                          )
                        }
                        aria-label={
                          showDetailedDescription
                            ? "Collapse Detailed Description"
                            : "Expand Detailed Description"
                        }
                        aria-expanded={showDetailedDescription}
                        aria-controls="detailed-description-content"
                        className="mr-2"
                      >
                        {showDetailedDescription ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
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
                        onClick={() => handleSelectAll("description", false)}
                      >
                        Reject All
                      </Button>
                    </div>
                  </div>

                  {showDetailedDescription && (
                    <div
                      id="detailed-description-content"
                      className="space-y-6"
                    >
                      {Array.from(
                        new Set(embodiments.description.map((e) => e.header))
                      )
                        .filter(Boolean)
                        .map((header) => {
                          const headerId = slugify(header!);
                          const headerEmbodiments =
                            embodiments.description.filter(
                              (e) => e.header === header
                            );
                          const categories = Array.from(
                            new Set(headerEmbodiments.map((e) => e.category))
                          ).filter(Boolean);

                          return (
                            <div
                              key={`header-${header}`}
                              id={headerId}
                              data-section-id={headerId}
                              className="mb-10 pt-4"
                            >
                              <div className="mb-6 pb-2 border-b">
                                <h2 className="text-xl font-bold">{header}</h2>
                              </div>

                              {categories.map((category) => {
                                const categoryId = `${headerId}-${slugify(
                                  category!
                                )}`;
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
                                    <div className="border-b pb-2 mb-4">
                                      <h3 className="text-lg font-semibold capitalize">
                                        {category}
                                        <span className="ml-2 text-sm text-muted-foreground font-normal">
                                          ({categoryEmbodiments.length}{" "}
                                          embodiments)
                                        </span>
                                      </h3>
                                    </div>

                                    <div className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                                      <h4 className="font-semibold text-md mb-2 text-gray-700">
                                        Summary for {category}
                                      </h4>
                                      <div className="space-y-2 text-sm text-gray-600">
                                        <p>
                                          Lorem ipsum dolor sit amet,
                                          consectetur adipiscing elit. Sed do
                                          eiusmod tempor incididunt ut labore et
                                          dolore magna aliqua. Ut enim ad minim
                                          veniam, quis nostrud exercitation
                                          ullamco laboris nisi ut aliquip ex ea
                                          commodo consequat.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {categoryEmbodiments.map((embodiment) => (
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
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div
                  id="claims"
                  data-section-id="claims"
                  className="mb-12 pt-4"
                >
                  <div className="group relative border-l-4 border-primary pl-4 mb-6 flex justify-between items-center">
                    <div
                      className="cursor-pointer flex-grow"
                      onClick={() =>
                        toggleAndScroll("claims", showClaims, setShowClaims)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleAndScroll("claims", showClaims, setShowClaims);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showClaims}
                      aria-controls="claims-content"
                    >
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
                          handleViewOriginal("Claims", mockRawData.claims);
                        }}
                      >
                        View Original
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleAndScroll("claims", showClaims, setShowClaims)
                        }
                        aria-label={
                          showClaims ? "Collapse Claims" : "Expand Claims"
                        }
                        aria-expanded={showClaims}
                        aria-controls="claims-content"
                        className="mr-2"
                      >
                        {showClaims ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
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
                  </div>

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
                            the overall system and method, as well as dependent
                            claims that specify particular features and
                            refinements. The claims are drafted to protect the
                            novel aspects of the manufacturing process and the
                            resulting electronic device.
                          </p>
                          <p>
                            The claims cover the unique combination of material
                            processing, component assembly, and quality control
                            subsystems, which collectively achieve unprecedented
                            efficiency and product quality.
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

                            <p className="text-sm">{embodiment.description}</p>
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
      </div>
    </div>
  );
}
