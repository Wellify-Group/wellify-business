import { create } from 'zustand';
import { LucideIcon } from 'lucide-react';
import { BusinessBenefit } from '@/data/businessModalConfig';

export interface BusinessModalData {
  id: string;
  title: string;
  format?: string;
  description: string;
  benefits?: BusinessBenefit[];
  howToStart?: string;
  features?: string[];
  functions?: string[];
  icon?: React.ReactNode; // Иконка ниши
}

interface BusinessModalStore {
  isOpen: boolean;
  modalData: BusinessModalData | null;
  openModal: (data: BusinessModalData) => void;
  closeModal: () => void;
}

export const useBusinessModalStore = create<BusinessModalStore>((set) => ({
  isOpen: false,
  modalData: null,
  openModal: (data) => set({ isOpen: true, modalData: data }),
  closeModal: () => set({ isOpen: false, modalData: null }),
}));

