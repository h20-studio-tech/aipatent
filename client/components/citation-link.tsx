"use client";

import React from "react";

interface CitationProps {
  chunkId: number;
  chunk?: {
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  };
  onClick: (chunkId: number) => void;
}

export function Citation({ chunkId, chunk, onClick }: CitationProps) {
  return (
    <sup
      className="citation cursor-pointer text-blue-600 hover:bg-blue-50 px-1 rounded transition-colors"
      onClick={() => onClick(chunkId)}
      title={chunk ? `Source: ${chunk.filename}, Page ${chunk.page_number}` : `Chunk ${chunkId}`}
    >
      [{chunkId}]
    </sup>
  );
}

interface CitedMessageProps {
  message: string;
  chunks: Array<{
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }>;
  onCitationClick: (chunkId: number) => void;
}

export function CitedMessage({ message, chunks, onCitationClick }: CitedMessageProps) {
  // Parse message and render with citations
  const renderMessage = () => {
    const parts = message.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const chunkId = parseInt(match[1]);
        const chunk = chunks.find(c => c.chunk_id === chunkId);
        
        return (
          <Citation 
            key={index}
            chunkId={chunkId}
            chunk={chunk}
            onClick={onCitationClick}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  return <div className="cited-message">{renderMessage()}</div>;
}

interface FootnotesProps {
  message: string;
  chunks: Array<{
    chunk_id: number;
    filename: string;
    page_number: number;
    text: string;
  }>;
  onCitationClick: (chunkId: number) => void;
}

export function Footnotes({ message, chunks, onCitationClick }: FootnotesProps) {
  // Extract unique chunk IDs from message
  const citationRegex = /\[(\d+)\]/g;
  const usedChunkIds = new Set<number>();
  let match;
  
  while ((match = citationRegex.exec(message)) !== null) {
    usedChunkIds.add(parseInt(match[1]));
  }
  
  const footnotes = Array.from(usedChunkIds).map(chunkId => {
    const chunk = chunks.find(c => c.chunk_id === chunkId);
    return chunk;
  }).filter(Boolean);

  if (footnotes.length === 0) return null;

  return (
    <div className="footnote-section mt-6 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold mb-2">Sources</h3>
      <div className="space-y-2">
        {footnotes.map((chunk) => (
          <div
            key={chunk!.chunk_id}
            className="footnote-item text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => onCitationClick(chunk!.chunk_id)}
          >
            <span className="font-medium">[{chunk!.chunk_id}]</span>{" "}
            <span className="text-gray-600">{chunk!.filename}, Page {chunk!.page_number}</span>
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {chunk!.text.substring(0, 150)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}