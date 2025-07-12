"use client";

import type { FC } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { metadata } from "@/lib/metadata";
import { Info } from "lucide-react";

interface MetadataPanelProps {
  activeSection: "approach" | "technology" | "innovation";
  metaData:
    | {
        chunk_id: number;
        filename: string;
        page_number: number;
        text: string;
      }[]
    | null;
}

const MetadataPanel: FC<MetadataPanelProps> = ({ activeSection, metaData }) => {
  const sectionMetadata = metadata[activeSection];

  const hasMetadata = metaData && metaData.length > 0;

  return (
    <div className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {sectionMetadata.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex-1 overflow-auto space-y-3 p-2 text-sm break-words whitespace-pre-wrap">
          {hasMetadata ? (
            metaData!.map((item, index) => (
              <div
                key={`${item.chunk_id}-${index}`}
                className="border border-border bg-white dark:bg-muted p-4 rounded-lg shadow-sm"
              >
                <p>
                  <span className="font-semibold">Chunk ID:</span>{" "}
                  {item.chunk_id}
                </p>
                <p>
                  <span className="font-semibold">Filename:</span>{" "}
                  <span className="break-words">{item.filename}</span>
                </p>
                <p>
                  <span className="font-semibold">Page Number:</span>{" "}
                  {item.page_number}
                </p>
                <p>
                  <span className="font-semibold">Text:</span>{" "}
                  <span className="italic text-muted-foreground break-words whitespace-pre-wrap">
                    {item.text}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground italic py-8">
              💡 Ask a question to inspect the metadata here.
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default MetadataPanel;
