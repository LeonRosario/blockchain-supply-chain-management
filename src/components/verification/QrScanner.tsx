import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, ImageUp, Loader2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { Modal } from '@/components/common';

interface QrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export default function QrScanner({ isOpen, onClose, onScan }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const resultRef = useRef(false);
  const onScanRef = useRef(onScan);

  const [isStarting, setIsStarting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    resultRef.current = false;
    setScanError(null);
    setIsStarting(true);

    const stopCamera = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError('Camera scanning is not supported by this browser. Upload a QR image instead.');
        setIsStarting(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!active) return;
        setIsStarting(false);

        const scanFrame = () => {
          const currentVideo = videoRef.current;
          const canvas = canvasRef.current;
          if (!currentVideo || !canvas || resultRef.current) return;
          if (currentVideo.readyState === currentVideo.HAVE_ENOUGH_DATA) {
            const width = currentVideo.videoWidth;
            const height = currentVideo.videoHeight;
            if (width > 0 && height > 0) {
              canvas.width = width;
              canvas.height = height;
              const context = canvas.getContext('2d');
              if (context) {
                context.drawImage(currentVideo, 0, 0, width, height);
                const imageData = context.getImageData(0, 0, width, height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'dontInvert',
                });
                if (code?.data) {
                  resultRef.current = true;
                  stopCamera();
                  onScanRef.current(code.data);
                  return;
                }
              }
            }
          }
          frameRef.current = requestAnimationFrame(scanFrame);
        };
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch (cameraError) {
        if (!active) return;
        setIsStarting(false);
        const name =
          cameraError && typeof cameraError === 'object' && 'name' in cameraError
            ? (cameraError as { name?: string }).name
            : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setScanError(
            'Camera permission was denied. Allow camera access or upload a QR code image instead.'
          );
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setScanError('No camera was found on this device. Upload a QR code image instead.');
        } else {
          setScanError('The camera could not be started. Upload a QR code image instead.');
        }
      }
    };

    start();

    return () => {
      active = false;
      stopCamera();
    };
  }, [isOpen]);

  const handleFile = async (file: File) => {
    setScanError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('The image could not be read.'));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('The image could not be decoded.'));
        element.src = dataUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image decoding is not supported.');
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (!code?.data) {
        setScanError('No QR code was detected in that image. Try a clearer photo.');
        return;
      }
      onScan(code.data);
    } catch (fileError) {
      setScanError(
        fileError instanceof Error ? fileError.message : 'The image could not be read.'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Scan a product QR code"
      description="Point the camera at the QR code. Frames are processed in your browser and are never uploaded."
      size="md"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-video w-full object-cover"
            aria-label="Camera preview for QR scanning"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {scanError && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {scanError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="h-4 w-4" />
            Camera or image upload
          </p>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="mr-2 h-4 w-4" />
              Upload QR image
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <ScanLine className="mt-0.5 h-4 w-4 shrink-0" />
          Scanning only extracts the product identifier. Authenticity is checked separately
          against the blockchain service after scanning.
        </p>
      </div>
    </Modal>
  );
}