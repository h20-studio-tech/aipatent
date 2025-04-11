// components/ProcessingLoader.tsx

import { Loader2 } from "lucide-react";
import React from "react";

interface ProcessingLoaderProps {
  processingFileName: string;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({
  processingFileName,
}) => {
  return (
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
  );
};

export default ProcessingLoader;
