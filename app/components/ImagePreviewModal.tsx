import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";

interface ImagePreviewModalProps {
  imageUrl: string;
  alt: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreviewModal({
  imageUrl,
  alt,
  title = "Photo Preview",
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = alt.replace(/\s+/g, '-').toLowerCase() + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Click the image to zoom, or use the buttons below for more options
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto rounded-lg cursor-zoom-in"
            loading="lazy"
            onClick={handleOpenInNewTab}
          />
          
          {/* Close button in corner */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={handleOpenInNewTab}
            variant="outline"
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
