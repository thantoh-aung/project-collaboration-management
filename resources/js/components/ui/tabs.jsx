import React, { useState } from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

const TabsList = ({ children, className }) => {
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
      className
    )}>
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, children, className }) => {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext)
  
  const isActive = activeValue === value
  
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        isActive 
          ? "bg-white text-gray-900 shadow-sm" 
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, children, className }) => {
  const { value: activeValue } = React.useContext(TabsContext)
  
  if (activeValue !== value) {
    return null
  }
  
  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  )
}

const TabsContext = React.createContext({
  value: null,
  onValueChange: () => {}
})

const TabsProvider = ({ value, onValueChange, children }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      {children}
    </TabsContext.Provider>
  )
}

// Wrap the main Tabs component with the provider
const TabsWithProvider = ({ value, onValueChange, children, className }) => {
  return (
    <TabsProvider value={value} onValueChange={onValueChange}>
      <Tabs value={value} onValueChange={onValueChange} className={className}>
        {children}
      </Tabs>
    </TabsProvider>
  )
}

export { TabsWithProvider as Tabs, TabsList, TabsTrigger, TabsContent }
