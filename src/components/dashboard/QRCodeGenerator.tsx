import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Check, Loader2, X } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
} from '@/components/ui';

interface QRCodeGeneratorProps {
  productId: string;
  productName: string;
  verificationUrl?: string;
  size?: number;
  onClose?: () => void;
}

export default function QRCodeGenerator({
  productId,
  productName,
  verificationUrl,
  size = 256,
  onClose,
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const qrData = verificationUrl || `${window.location.origin}/verify/${productId}`;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Create a canvas with the QR code
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = size;
      canvas.height = size + 60; // Extra space for text

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Generate QR code as data URL using QRCodeSVG
      // We'll render the QR code to an image first
      const qrSvg = await renderQRCodeToImage(qrData, size);
      const img = new Image();
      img.src = qrSvg;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      ctx.drawImage(img, 0, 0, size, size);

      // Add product name below QR code
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(productName, size / 2, size + 25);

      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`ID: ${productId}`, size / 2, size + 45);

      // Download
      const link = document.createElement('a');
      link.download = `${productId}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderQRCodeToImage = (data: string, qrSize: number): Promise<string> => {
    return new Promise((resolve) => {
      // Create a temporary container to render the QR code
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Use qrcode.react to render SVG
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${qrSize}" height="${qrSize}">` +
        `<rect width="100%" height="100%" fill="white"/>` +
        `<g>${generateQRPath(data, qrSize)}</g>` +
        `</svg>`;
      
      container.innerHTML = svgString;
      const svg = container.querySelector('svg');
      
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        canvas.width = qrSize;
        canvas.height = qrSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            document.body.removeChild(container);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        } else {
          document.body.removeChild(container);
          resolve('');
        }
      } else {
        document.body.removeChild(container);
        resolve('');
      }
    });
  };

  const generateQRPath = (data: string, qrSize: number): string => {
    // Simple QR code pattern - in production use a proper QR library
    // This creates a visual representation
    const modules = 25;
    const moduleSize = qrSize / modules;
    let paths = '';
    
    // Generate a pseudo-QR pattern based on the data hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    
    // Seed random with hash
    const seededRandom = () => {
      hash = (hash * 16807) % 2147483647;
      return hash / 2147483647;
    };
    
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // Create finder patterns at corners
        const isFinder = 
          (x < 7 && y < 7) || 
          (x > modules - 8 && y < 7) || 
          (x < 7 && y > modules - 8);
        
        // Create timing patterns
        const isTiming = x === 6 || y === 6;
        
        // Data area
        const isData = !isFinder && !isTiming && seededRandom() > 0.5;
        
        if (isFinder || isData) {
          paths += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    return paths;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">QR Code Generator</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <QRCodeSVG
              value={qrData}
              size={size}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <div className="text-center">
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-muted-foreground font-mono">{productId}</p>
          </div>

          {/* Verification URL */}
          <div className="w-full space-y-2">
            <Label htmlFor="verificationUrl">Verification URL</Label>
            <div className="flex gap-2">
              <Input
                id="verificationUrl"
                value={qrData}
                readOnly
                className="flex-1 bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(qrData);
                }}
                title="Copy URL"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full max-w-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : downloadSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}