import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Expand } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface MermaidDiagramProps {
  diagram: string;
  title: string;
  description?: string;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  diagram,
  title,
  description,
  className = ""
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Import mermaid dynamically
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: true,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#6366f1',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#4f46e5',
            lineColor: '#6b7280',
            secondaryColor: '#1f2937',
            tertiaryColor: '#374151',
            background: '#111827',
            mainBkg: '#1f2937',
            secondBkg: '#374151',
            tertiaryBkg: '#4b5563'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis'
          }
        });

        if (diagramRef.current) {
          diagramRef.current.innerHTML = '';
          const element = document.createElement('div');
          element.className = 'mermaid';
          element.textContent = diagram;
          diagramRef.current.appendChild(element);
          
          await mermaid.run();
        }
      } catch (error) {
        console.error('Error loading mermaid:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="text-center p-8 text-gray-400">
              <p>Error loading diagram</p>
              <p class="text-sm mt-2">Please refresh the page</p>
            </div>
          `;
        }
      }
    };

    loadMermaid();
  }, [diagram]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(diagram);
    toast("Diagram code copied to clipboard");
  };

  const downloadSvg = () => {
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      toast("Diagram downloaded as SVG");
    }
  };

  const expandDiagram = () => {
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      if (svgElement.requestFullscreen) {
        svgElement.requestFullscreen();
      }
    }
  };

  return (
    <Card className={`bg-card/50 backdrop-blur border-border/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSvg}
              className="h-8 w-8 p-0"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={expandDiagram}
              className="h-8 w-8 p-0"
            >
              <Expand className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={diagramRef}
          className="mermaid-container overflow-x-auto min-h-[400px] bg-gray-900/50 rounded-lg p-4"
        />
      </CardContent>
    </Card>
  );
};