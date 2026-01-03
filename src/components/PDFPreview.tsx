import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, Maximize2, X, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFPreviewProps {
  url: string;
  title?: string;
  className?: string;
  showPreviewButton?: boolean;
  showDownloadButton?: boolean;
}

export function PDFPreview({ 
  url, 
  title = "Document Preview",
  className,
  showPreviewButton = true,
  showDownloadButton = true
}: PDFPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPDF = url?.toLowerCase().endsWith('.pdf') || url?.includes('/pdf');

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showPreviewButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(
            "max-w-5xl w-[95vw] p-0 gap-0",
            isFullscreen && "max-w-full h-full w-full rounded-none"
          )}>
            <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                {title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </DialogHeader>
            <div className={cn(
              "w-full bg-muted/50",
              isFullscreen ? "h-[calc(100vh-60px)]" : "h-[70vh]"
            )}>
              {isPDF ? (
                <iframe
                  src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full h-full border-0"
                  title={title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Preview not available for this file type
                  </p>
                  <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {showDownloadButton && (
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href={url} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </Button>
      )}
    </div>
  );
}
