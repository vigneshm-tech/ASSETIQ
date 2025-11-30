export interface AssetData {
  "Asset Tag": string;
  "Block": string;
  "Floor": string;
  "Dept": string;
  "Brand": string;
  "Service Tag": string;
  "Computer Name": string;
  "Processor Type": string;
  "Processor Generation": string;
  "Processor Speed (GHz)": string;
  "RAM (GB)": string;
  "Hard Drive Type": string;
  "Hard Drive Size": string;
  "Graphics Card": string;
  "Operating System OS": string;
  "Windows License Key": string;
  "Installed Applications": string;
  "Antivirus": string;
  "IP Address": string;
  "Remarks": string;
}

export type ProcessingStatus = 'idle' | 'reading' | 'analyzing' | 'complete' | 'error';

export interface ProcessedFile {
  filename: string;
  status: ProcessingStatus;
  itemsFound: number;
}