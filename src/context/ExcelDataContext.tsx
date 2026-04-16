'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define the new ExcelRow type to match your data structure.
// Keys with spaces must be enclosed in quotes.
export interface ExcelRow {
  'First Name': string;
  'Last Name': string;
  Company: string;
  Title: string;
  'Phone number 1': string;
  'Phone Number 2': string;
  _id?: number;
}

interface ExcelDataContextType {
  excelData: ExcelRow[];
  setExcelData: (data: ExcelRow[]) => void;
  dataToSchedule: ExcelRow[];
  setDataToSchedule: (data: ExcelRow[]) => void;
}

const ExcelDataContext = createContext<ExcelDataContextType | undefined>(
  undefined
);

export const ExcelDataProvider = ({ children }: { children: ReactNode }) => {
  const [excelData, setExcelDataState] = useState<ExcelRow[]>([]);
  const [dataToSchedule, setDataToSchedule] = useState<ExcelRow[]>([]);

  const setExcelData = (data: ExcelRow[]) => {
    // Add a unique `_id` to each row for stable selection in the UI
    const dataWithIds = data.map((row, index) => ({ ...row, _id: index }));
    setExcelDataState(dataWithIds);
  };

  return (
    <ExcelDataContext.Provider
      value={{ excelData, setExcelData, dataToSchedule, setDataToSchedule }}
    >
      {children}
    </ExcelDataContext.Provider>
  );
};

export const useExcelData = () => {
  const context = useContext(ExcelDataContext);
  if (context === undefined) {
    throw new Error('useExcelData must be used within an ExcelDataProvider');
  }
  return context;
};
