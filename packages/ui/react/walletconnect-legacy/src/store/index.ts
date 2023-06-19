import { create } from 'zustand'

interface ModalStore {
  open: boolean
  setOpen: (by: boolean) => void
}

export const useModalStore = create<ModalStore>()((set) => ({
  open: false,
  setOpen: (open) => set((state) => ({ open })),
}))

export const openModal = ()=> useModalStore.getState().setOpen(true)