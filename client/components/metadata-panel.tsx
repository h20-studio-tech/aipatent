"use client";

import type { FC } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { metadata } from "@/lib/metadata";
import { Info } from "lucide-react";

interface MetadataPanelProps {
  activeSection: "approach" | "technology" | "innovation";
  metaData: {
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }[];
}

const MetadataPanel: FC<MetadataPanelProps> = ({ activeSection, metaData }) => {
  const sectionMetadata = metadata[activeSection];

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {sectionMetadata.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-2 rounded-md max-h-[calc(100vh-100px)] overflow-y-auto">
          {metaData.length > 0 ? (
            <pre className="text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(metaData, null, 2)}
            </pre>
          ) : (
            <div className="text-sm text-muted-foreground italic text-center py-8">
              💡 Ask a question to inspect the metadata here.
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default MetadataPanel;
