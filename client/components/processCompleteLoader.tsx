// components/ProcessCompleteLoader.tsx

import { CheckCircle } from "lucide-react";
import React from "react";
import Confetti from "react-confetti";

interface ProcessCompleteLoaderProps {
  processingFileName: string;
  showConfetti: boolean;
  successIcon?: React.RefObject<HTMLDivElement | null>; // ✅ Fix here
}

const ProcessCompleteLoader: React.FC<ProcessCompleteLoaderProps> = ({
  processingFileName,
  showConfetti,
  successIcon,
}) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}
      <div className="text-center max-w-md mx-auto p-8 z-10">
        <div
          ref={successIcon}
          className="rounded-full bg-green-100 p-3 w-20 h-20 flex items-center justify-center mx-auto mb-6 relative"
        >
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">PDF Processed Successfully</h3>
        <p className="text-muted-foreground mb-4">
          <span className="font-medium">{processingFileName}</span> is ready for
          use.
        </p>
        <p className="text-sm text-muted-foreground">
          You can now interact with this document.
        </p>
      </div>
    </div>
  );
};

export default ProcessCompleteLoader;
