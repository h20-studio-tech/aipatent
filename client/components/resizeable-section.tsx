"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Check,
  Maximize2,
  RefreshCw,
  Info,
  ArrowUpRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

export interface SectionMetadata {
  type: string;
  timestamp: number;
  userGuidance?: string;
  regenerationCount?: number;
  lastEdited?: number;
}

interface ResizableSectionProps {
  title: string;
  content: string;
  metadata: SectionMetadata;
  onContentChange: (newContent: string) => void;
  onEdit: () => void;
  onRegenerate: () => void;
}

export function ResizableSection({
  title,
  content,
  metadata,
  onContentChange,
  onEdit,
  onRegenerate,
}: ResizableSectionProps) {
  const [height, setHeight] = useState(350); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update editedContent when content prop changes
  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // Handle resize start
  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    setIsResizing(true);
    if ("touches" in e) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(e.clientY);
    }
    setStartHeight(height);
    e.preventDefault();
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    const newHeight = Math.max(100, startHeight + deltaY); // Minimum height of 100px
    setHeight(newHeight);
    e.preventDefault();
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add and remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.addEventListener("touchmove", handleResizeMove);
      document.addEventListener("touchend", handleResizeEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("touchmove", handleResizeMove);
      document.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing]);

  const toggleEditMode = () => {
    if (isEditing) {
      onContentChange(editedContent);
      toast({
        title: "Success",
        description: `${title} section edits saved successfully!`,
        variant: "success",
        duration: 3000,
      });
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (isModalOpen && modalTextareaRef.current) {
          modalTextareaRef.current.focus();
        } else if (!isModalOpen && textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isEditing, isModalOpen]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Scroll to rawData card with section "summary"
  const handleRedirectToSummaryRaw = () => {
    const el = document.getElementById("section-summary");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="border rounded-md p-2 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMetadata(true)}
            className="h-8 w-8 p-0 mr-2"
            title="View section metadata"
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Metadata</span>
          </Button>
          <h4 className="font-medium text-lg">{title}</h4>
        </div>
        <div className="flex space-x-2">
          {/* Redirect button for specific sections */}
          {(title === "Summary of Invention" ||
            title === "Target Overview" ||
            title === "Disease Rationale" ||
            title === "Underlying Mechanism" ||
            title === "High Level Concept" ||
            title === "Terms / Definitions" ||
            title === "Claims") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={
                title === "Summary of Invention"
                  ? handleRedirectToSummaryRaw
                  : title === "Terms / Definitions"
                  ? () => {
                      const el = document.getElementById("section-keyterms");
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }
                  : title === "Claims"
                  ? () => {
                      const el = document.getElementById("section-claims");
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }
                  : () => {
                      const el = document.getElementById("section-description");
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }
              }
              className="h-8 w-8 p-0"
              title={
                title === "Summary of Invention"
                  ? "Go to raw summary data"
                  : title === "Terms / Definitions"
                  ? "Go to raw keyterms data"
                  : title === "Claims"
                  ? "Go to raw claims data"
                  : "Go to raw description data"
              }
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="sr-only">
                {title === "Summary of Invention"
                  ? "Go to raw summary data"
                  : title === "Terms / Definitions"
                  ? "Go to raw keyterms data"
                  : title === "Claims"
                  ? "Go to raw claims data"
                  : "Go to raw description data"}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="sr-only">Expand</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleEditMode}
            className="h-8 w-8 p-0"
          >
            {isEditing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            <span className="sr-only">{isEditing ? "Save" : "Edit"}</span>
          </Button>
        </div>
      </div>

      <div
        ref={resizeRef}
        className="relative border rounded-md bg-white overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full p-3 focus:outline-none focus:ring-2 focus:ring-black resize-none font-mono text-sm"
            style={{ minHeight: "100%" }}
          />
        ) : (
          <div className="p-3 h-full overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown>{editedContent}</ReactMarkdown>
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 cursor-ns-resize hover:bg-gray-300"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      </div>

      <div className="flex space-x-2 mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center gap-1 bg-transparent"
        >
          <span>Feedback</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          className="flex items-center gap-1 bg-transparent"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          <span>Regenerate</span>
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          hideCloseButton
          className="sm:max-w-6xl w-full h-[95vh] flex flex-col p-4"
        >
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={toggleEditMode}>
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Save
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </>
                )}
              </Button>
              <DialogClose asChild>
                <Button size="sm" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="flex-grow border rounded-md overflow-hidden flex">
            {isEditing ? (
              <textarea
                ref={modalTextareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-3 focus:outline-none resize-none font-mono text-sm"
              />
            ) : (
              <div className="p-3 h-full w-full overflow-y-auto prose prose-sm max-w-none">
                <ReactMarkdown>{editedContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMetadata} onOpenChange={setShowMetadata}>
        <DialogContent showCloseButton={false} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Section Metadata</DialogTitle>
            <DialogDescription>
              Information about how this section was generated
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Section Type</h4>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {metadata.type}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Generated On</h4>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {formatDate(metadata.timestamp)}
                </p>
              </div>
              {metadata.lastEdited && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Last Edited</h4>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {formatDate(metadata.lastEdited)}
                  </p>
                </div>
              )}
              {metadata.regenerationCount !== undefined && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Regeneration Count
                  </h4>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {metadata.regenerationCount}
                  </p>
                </div>
              )}
              {metadata.userGuidance && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    Last User Guidance
                  </h4>
                  <p className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">
                    {metadata.userGuidance}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
