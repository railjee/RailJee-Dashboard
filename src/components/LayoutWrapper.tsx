'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { Sidebar } from './Sidebar'

const MenuContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function useMenu() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within LayoutWrapper')
  }
  return context
}

interface LayoutWrapperProps {
  children: ReactNode
  onLogout?: () => void
  // current logged-in user (from auth session)
  user?: {
    username: string
  } | null
}

export function LayoutWrapper({ children, onLogout, user }: LayoutWrapperProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <MenuContext.Provider value={{ isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen }}>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar - Desktop always visible, Mobile as drawer */}
        <div className="hidden md:block">
          <Sidebar isOpen={true} onLogout={onLogout} user={user} />
        </div>

        {/* Mobile drawer */}
        <div className="md:hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} onLogout={onLogout} user={user} />
        </div>

        <main className="md:ml-56 flex-1 overflow-auto flex flex-col w-full">
          {children}
        </main>
      </div>
    </MenuContext.Provider>
  )
}
