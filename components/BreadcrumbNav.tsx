"use client"

import React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb navigation component for showing current page hierarchy
 */
export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className = "" }) => {
  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      {/* Home link */}
      <Link
        href="/"
        className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <Home size={16} />
        <span>Timer</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          <ChevronRight size={16} className="text-gray-600" />
          {index === items.length - 1 ? (
            // Current page (not clickable)
            <span className="flex items-center gap-1 text-gray-200 font-medium">
              {item.icon}
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb item
            <Link
              href={item.href}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

/**
 * Hook to get breadcrumb items based on current path
 */
export const useBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = []

  // Define route mappings
  const routeMap: Record<string, { label: string; icon?: React.ReactNode }> = {
    '/tasks': { label: 'Tasks' },
    '/analytics': { label: 'Analytics' },
    '/settings': { label: 'Settings' },
    '/help': { label: 'Help' },
    '/menu': { label: 'Menu' },
  }

  // Build breadcrumb trail
  const pathSegments = pathname.split('/').filter(Boolean)
  let currentPath = ''

  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    
    if (routeMap[currentPath]) {
      breadcrumbs.push({
        label: routeMap[currentPath].label,
        href: currentPath,
        icon: routeMap[currentPath].icon,
      })
    }
  })

  return breadcrumbs
} 