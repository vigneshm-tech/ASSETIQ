import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AssetData } from "../types";

// Define the exact schema requested by the user
const assetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    "Asset Tag": { type: Type.STRING, description: "The asset tag (derived from filename)." },
    "Block": { type: Type.STRING, description: "Building block or location code." },
    "Floor": { type: Type.STRING, description: "Floor number or level." },
    "Dept": { type: Type.STRING, description: "Department name." },
    "Brand": { type: Type.STRING, description: "Device brand/manufacturer (e.g., Dell, HP)." },
    "Service Tag": { type: Type.STRING, description: "System Serial Number from System Model section." },
    "Computer Name": { type: Type.STRING, description: "Hostname or computer name." },
    "Processor Type": { type: Type.STRING, description: "CPU model identifier (i5, i7, i9, Pentium, Xeon, Intel, AMD)." },
    "Processor Generation": { type: Type.STRING, description: "CPU generation (e.g., 10th Gen, 11th Gen)." },
    "Processor Speed (GHz)": { type: Type.STRING, description: "CPU clock speed." },
    "RAM (GB)": { type: Type.STRING, description: "Total memory capacity in rounded GB (integer only)." },
    "Hard Drive Type": { type: Type.STRING, description: "SSD or HDD." },
    "Hard Drive Size": { type: Type.STRING, description: "Storage capacity." },
    "Graphics Card": { type: Type.STRING, description: "GPU model." },
    "Operating System OS": { type: Type.STRING, description: "OS name and version." },
    "Windows License Key": { type: Type.STRING, description: "Product key if available." },
    "Installed Applications": { type: Type.STRING, description: "Comma separated list of key software installed." },
    "Antivirus": { type: Type.STRING, description: "Antivirus software name." },
    "IP Address": { type: Type.STRING, description: "Network IP address." },
    "Remarks": { type: Type.STRING, description: "Any additional notes or comments." },
  },
  required: [
    "Asset Tag", "Block", "Floor", "Dept", "Brand", "Service Tag",
    "Computer Name", "Processor Type", "Processor Generation", 
    "Processor Speed (GHz)", "RAM (GB)", "Hard Drive Type", 
    "Hard Drive Size", "Graphics Card", "Operating System OS", 
    "Windows License Key", "Installed Applications", "Antivirus", 
    "IP Address", "Remarks"
  ]
};

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: assetSchema,
};

export const extractAssetsFromHtml = async (htmlContent: string, filename: string): Promise<AssetData[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Clean up HTML slightly to save tokens (remove script/style tags)
    const cleanedHtml = htmlContent
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .substring(0, 900000); // Safety limit

    // Derive Asset Tag from filename (remove .html, .htm, .mhtml)
    const cleanFilename = filename.replace(/\.(html|htm|mhtml)$/i, "");

    const prompt = `
      You are an expert data extractor for "AssetsIQ".
      Analyze the provided HTML content and extract IT Asset details according to STRICT rules.
      
      CRITICAL EXTRACTION RULES:
      1. **Asset Tag**: I will programmatically set this to "${cleanFilename}", but please include it in the JSON as "${cleanFilename}".
      2. **Service Tag (Serial Number)**: 
         - Extract the Serial Number *ONLY* from the section titled "System Model", specifically looking for the field "System Serial Number".
         - Do NOT look in "Main Circuit Board", "Chassis", or "BIOS" for this specific value.
         - If "System Serial Number" under "System Model" is not found, leave this field BLANK ("").
      3. **Processor Type**: Standardize the output.
         - The value MUST be one of these exact strings (case-insensitive mapping): "i5", "i7", "i9", "Pentium", "Xeon", "Intel", "AMD".
         - Example: "Intel(R) Core(TM) i5-10500" -> "i5".
         - Example: "AMD Ryzen 5" -> "AMD".
         - If it contains "Intel" but not a specific family like i5/i7, output "Intel".
      4. **Processor Generation**: Extract the generation if available (e.g., "10th Gen", "11th Gen"). If implied by the model (e.g. i5-10500), infer "10th Gen".
      5. **RAM (GB)**: Return the total memory as a ROUNDED INTEGER representing Gigabytes. 
         - Example: "8192 MB" -> "8". "16384 MB" -> "16". "7.8 GB" -> "8".
         - **DO NOT** return boolean values (true/false).
         - **DO NOT** return units like "GB". Just the number string.
      
      Extract the following fields:
      Asset Tag, Block, Floor, Dept, Brand, Service Tag, Computer Name, 
      Processor Type, Processor Generation, Processor Speed (GHz), RAM (GB), 
      Hard Drive Type, Hard Drive Size, Graphics Card, Operating System OS, 
      Windows License Key, Installed Applications, Antivirus, IP Address, Remarks.

      For "Installed Applications", return a comma-separated string.
      If a field is missing, return an empty string.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }, { text: cleanedHtml }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for high precision
      },
    });

    const resultText = response.text;
    
    if (!resultText) {
      return [];
    }

    const parsedData = JSON.parse(resultText) as AssetData[];
    
    // Post-processing to enforce strict filename rule
    return parsedData.map(item => ({
      ...item,
      "Asset Tag": cleanFilename // Enforce the filename as asset tag explicitly
    }));

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};