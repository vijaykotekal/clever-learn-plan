import * as React from "react"
import { cn } from "@/lib/utils"

// Simple chart components for our study planner
export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full h-full", className)}
      {...props}
    />
  )
})
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = ({ children, ...props }: any) => {
  return <div {...props}>{children}</div>
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: any[]
    label?: string
  }
>(({ className, active, payload, label, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {label && <p className="font-medium">{label}</p>}
      {payload.map((item: any, index: number) => (
        <p key={index} className="text-sm">
          <span className="font-medium">{item.name}:</span> {item.value}
        </p>
      ))}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = ({ children, ...props }: any) => {
  return <div {...props}>{children}</div>
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
  }
>(({ className, payload, ...props }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4 pt-3", className)}
      {...props}
    >
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"