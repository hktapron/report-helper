import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Smart Gemini Translation Engine for CAAT-22
 * @param {string} thaiText - The current Thai preview text
 * @param {object} formData - Current state values
 * @returns {string} - Professional English CAAT-22 report
 */
export const translateToCAAT22 = async (thaiText, formData) => {
  // Priority: 1. localStorage (User's private key), 2. Environment Variable
  const localKey = localStorage.getItem('vtsp_gemini_key');
  const finalKey = localKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!finalKey) {
    throw new Error("Missing API Key: กรุณาไปที่หน้า Account เพื่อระบุ Gemini API Key ก่อนใช้งานครับ");
  }

  const genAI = new GoogleGenerativeAI(finalKey);
  
  if (!thaiText) return "";
  
  const safeData = formData || {};
  const today = new Date().toLocaleDateString('en-GB');

  // ใช้โมเดล Flash เวอร์ชั่นล่าสุดเพื่อความรวดเร็วและแม่นยำ
  let model;
  try {
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", 
      systemInstruction: "You are an expert aviation translator. Always translate the provided text using precise standard aviation terminology and maintain a highly formal, professional tone."
    });
  } catch (e) {
    throw new Error("Failed to initialize Gemini Model.");
  }

  const prompt = `
Translate and format the following Thai incident report into professional Aviation English.

[Data Variables]
Flight No: ${safeData.flight_no || 'N/A'}
A/C Registry: ${safeData.registration || 'N/A'}
A/C Type: ${safeData.ac_type || 'N/A'}
Route: ${safeData.route || 'N/A'}
Final Stand: ${safeData.stand_no || safeData.return_stand || 'N/A'}

[Thai Narrative]
${thaiText}

[Translation Rules]
1. Extract ONLY the chronological events. 
2. Translate to professional Aviation English (e.g., 'หลุมจอด' = Stand/Bay, 'ลากจูง' = Towed, 'รออะไหล่' = Awaiting spare parts/AOG, 'ดันถอย' = Pushback).
3. Format times properly as 'At HH:MM LT,'.
4. Assemble the final output EXACTLY in this format:

AIRPORT INCIDENT SUMMARY (CAAT-22)
----------------------------------
Date: ${today}
Subject: Technical Incident / Operational Disruption

FLIGHT INFORMATION:
Flight No: ${safeData.flight_no || 'N/A'}
A/C Registry: ${safeData.registration || 'N/A'}
A/C Type: ${safeData.ac_type || 'N/A'}
Route: ${safeData.route || 'N/A'}

CHRONOLOGY:
1. [Translated event...]
2. [Translated event...]

STATUS:
Safety protocols followed. No personnel injury reported.
Final Stand: ${safeData.stand_no || safeData.return_stand || 'N/A'}

APRON CONTROL UNIT
PHUKET INTERNATIONAL AIRPORT
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    // Clean up any stray markdown formatting
    return response.replace(/```(text|html)?\n?/g, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Gemini API Error Detail: ", error);
    throw new Error("API Error: " + (error.message || "ไม่สามารถเชื่อมต่อ AI ได้"));
  }
};
