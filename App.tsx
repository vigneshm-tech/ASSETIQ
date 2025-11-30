import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { extractAssetsFromHtml } from './services/geminiService';
import { AssetData, ProcessedFile } from './types';
import { FileText, Loader2, Download, Table as TableIcon, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [extractedData, setExtractedData] = useState<AssetData[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    setProcessedFiles(files.map(f => ({ filename: f.name, status: 'idle', itemsFound: 0 })));
    
    // We append data now instead of clearing, to support accumulating a table view.
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update status to reading/analyzing
      setProcessedFiles(prev => prev.map((pf, idx) => 
        idx === i ? { ...pf, status: 'reading' } : pf
      ));

      try {
        const textContent = await file.text();
        
        setProcessedFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'analyzing' } : pf
        ));

        // Pass filename to service to be used as Asset Tag
        const assets = await extractAssetsFromHtml(textContent, file.name);
        
        setExtractedData(prev => [...prev, ...assets]);
        
        setProcessedFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'complete', itemsFound: assets.length } : pf
        ));

      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        setProcessedFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error' } : pf
        ));
      }
    }

    setIsProcessing(false);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all extracted data?")) {
      setExtractedData([]);
      setProcessedFiles([]);
      setError(null);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (extractedData.length === 0) return;

    const filename = `AssetsIQ_Export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      const jsonString = JSON.stringify(extractedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(extractedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
      
      if (format === 'csv') {
        XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <TableIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">AssetsIQ</h1>
              <p className="text-xs text-slate-500 font-medium">HTML to Structured CSV Converter</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {extractedData.length > 0 && (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleClearData}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors mr-2"
                        title="Clear all data"
                    >
                        <Trash2 size={16} /> <span className="hidden sm:inline">Clear</span>
                    </button>
                    <button 
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button 
                        onClick={() => handleExport('xlsx')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Download size={16} /> Export Excel
                    </button>
                </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Import Source Files
          </h2>
          <FileUpload onFilesSelected={processFiles} disabled={isProcessing} />
          
          {/* Processing Status List */}
          {processedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Processing Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {processedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3 overflow-hidden">
                       {file.status === 'reading' || file.status === 'analyzing' ? (
                           <Loader2 size={18} className="animate-spin text-primary shrink-0" />
                       ) : file.status === 'complete' ? (
                           <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                       ) : file.status === 'error' ? (
                           <AlertCircle size={18} className="text-red-500 shrink-0" />
                       ) : (
                           <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 shrink-0" />
                       )}
                       <span className="text-sm font-medium text-slate-700 truncate">{file.filename}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 shrink-0">
                        {file.status === 'complete' ? `${file.itemsFound} assets` : file.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                <AlertCircle size={20} className="mt-0.5" />
                <div>
                    <h4 className="font-semibold text-sm">Processing Error</h4>
                    <p className="text-sm opacity-90">{error}</p>
                </div>
            </div>
          )}
        </section>

        {/* Data Preview Section */}
        {extractedData.length > 0 && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TableIcon size={20} className="text-primary" />
                        Extracted Data Preview
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium ml-2">
                            {extractedData.length} Total Assets
                        </span>
                    </h2>
                </div>
                <DataTable data={extractedData} />
            </section>
        )}

        {/* Empty State / Instructional */}
        {extractedData.length === 0 && processedFiles.length === 0 && (
            <div className="text-center py-12">
                <h3 className="text-slate-400 font-medium">No data to display yet</h3>
                <p className="text-slate-400 text-sm mt-1">Upload HTML, HTM, or MHTML files above to start extracting asset information.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;