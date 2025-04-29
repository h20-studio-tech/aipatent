"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Import the useToast hook at the top of the file
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

// Update the ResizableSection component to use the toast
export function ResizableSection({
  title,
  content,
  metadata,
  onContentChange,
  onEdit,
  onRegenerate,
}: ResizableSectionProps) {
  const [height, setHeight] = useState(250); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showMetadata, setShowMetadata] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast(); // Add this line to use the toast

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

  // Update the toggleEditMode function to show a toast notification when saving changes
  const toggleEditMode = () => {
    if (isEditing) {
      // Save changes when exiting edit mode
      onContentChange(editedContent);

      // Show a toast notification
      toast({
        title: "Success",
        description: `${title} section edits saved successfully!`,
        variant: "success",
        duration: 3000,
      });
    } else {
      // Enter edit mode
      setIsEditing(true);
      // Focus the textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
    }

    setIsEditing(!isEditing);
  };

  // Maximize to full height
  const maximizeHeight = () => {
    setHeight(500); // Set to a larger height
  };

  // Minimize to default height
  const minimizeHeight = () => {
    setHeight(250); // Reset to default height
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
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
          {height > 250 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={minimizeHeight}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="sr-only">Minimize</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={maximizeHeight}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Maximize</span>
            </Button>
          )}
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
            className="w-full h-full p-3 focus:outline-none focus:ring-2 focus:ring-black resize-none"
            style={{ minHeight: "100%" }}
          />
        ) : (
          <div className="p-3 whitespace-pre-wrap h-full overflow-y-auto">
            {editedContent}
          </div>
        )}

        {/* Resize handle */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 cursor-ns-resize hover:bg-gray-300"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        />
      </div>

      <div className="flex space-x-2 mt-2">
        <Button
          variant="outline"
          onClick={onEdit}
          className="text-sm flex items-center gap-1"
        >
          <span>Provide Feedback</span>
        </Button>
        <Button
          variant="outline"
          onClick={onRegenerate}
          className="text-sm flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          <span>Regenerate</span>
        </Button>
      </div>

      {/* Metadata Dialog */}
      <Dialog open={showMetadata} onOpenChange={setShowMetadata}>
        <DialogContent className="sm:max-w-[500px]">
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
