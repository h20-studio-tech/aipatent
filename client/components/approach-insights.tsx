"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Define the ref type
interface ApproachInsightsRef {
  generateContent: () => void
}

const ApproachInsights = forwardRef<ApproachInsightsRef>((props, ref) => {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Expose the generateContent function to parent components via ref
  useImperativeHandle(ref, () => ({
    generateContent: () => {
      generateContent()
    },
  }))

  const generateContent = () => {
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      setContent(`# iPhone Manufacturing Process

The iPhone manufacturing process represents one of the most sophisticated and complex supply chain operations in modern consumer electronics. This analysis provides a comprehensive overview of the approach Apple takes to produce its flagship device.

## 1. Design and Engineering

The manufacturing process begins with Apple's industrial design team in California, where the device's form factor, materials, and specifications are determined. Engineers work closely with designers to translate aesthetic vision into technical specifications, creating detailed schematics and 3D models that will guide the manufacturing process.

Key considerations at this stage include:

- Material selection for durability, weight, and premium feel
- Component placement for optimal thermal management
- Structural integrity to withstand everyday use
- Manufacturing feasibility at scale

## 2. Component Sourcing

Apple employs a global network of suppliers for the iPhone's hundreds of components:

- Processors: Custom-designed Apple Silicon chips manufactured by TSMC in Taiwan
- Display panels: OLED screens primarily from Samsung and LG Display
- Memory chips: Sourced from manufacturers like Samsung, SK Hynix, and Micron
- Camera modules: Sony provides most image sensors
- Batteries: Assembled by specialized manufacturers in China and South Korea
- Structural components: CNC-machined aluminum housings from multiple suppliers

## 3. Assembly Process

Final assembly occurs primarily in factories operated by manufacturing partners like Foxconn and Pegatron in China, India, and other locations. The assembly process follows a precise sequence:

- PCB Assembly: The main logic board is populated with processors, memory, and other electronic components using surface-mount technology and reflow soldering.
- Subassembly Integration: Camera modules, speakers, haptic engines, and other subassemblies are prepared.
- Core Assembly: The logic board is connected to the battery and display assembly.
- Housing Installation: The core components are carefully placed into the machined aluminum and glass housing.
- Final Assembly: Remaining components like buttons and external ports are installed.

## 4. Quality Control

Apple implements rigorous quality control throughout the manufacturing process:

- Automated optical inspection systems verify component placement
- X-ray inspection ensures internal connections are properly formed
- Functional testing validates all hardware features
- Software testing confirms operating system stability
- Physical tests evaluate durability and water resistance

Devices that fail quality control are either repaired or recycled, depending on the nature of the defect.

## 5. Packaging and Distribution

The final steps involve packaging the iPhone with accessories and documentation, then distributing through Apple's sophisticated logistics network:

- Devices are loaded with the latest iOS version
- Each unit receives a final inspection before packaging
- Packaged products are palletized and shipped to distribution centers
- From distribution centers, products move to retail stores or directly to customers

## 6. Environmental Considerations

Apple has increasingly focused on environmental sustainability in iPhone manufacturing:

- Recycled materials are used where possible, including aluminum, rare earth elements, and tin
- Manufacturing facilities increasingly powered by renewable energy
- Packaging has been reduced and shifted to sustainable materials
- Apple operates an extensive recycling program for end-of-life devices

This comprehensive manufacturing approach enables Apple to produce over 200 million iPhones annually while maintaining consistent quality and introducing new models with increasingly advanced features. The process represents a remarkable achievement in supply chain management, precision manufacturing, and quality control at unprecedented scale.`)
      setIsLoading(false)
    }, 2000)
  }

  const handleSave = () => {
    setIsSaving(true)

    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Insights saved successfully",
        description: "Your approach insights have been saved to the project.",
        duration: 3000,
      })
    }, 1000)
  }

  return (
    <>
      <Card className="border-2 border-primary shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Approach Insights
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Meta-data
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Approach Meta-data</DialogTitle>
                  </DialogHeader>
                  <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {`{
  "section": "Approach",
  "metadata": {
    "lastUpdated": "${new Date().toISOString()}",
    "status": "In Progress",
    "completionPercentage": 75,
    "contributors": ["AI Assistant", "Research Team"],
    "relatedDocuments": 3,
    "wordCount": 842,
    "keyInsights": 12
  }
}`}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={handleSave} disabled={!content || isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative">
          {content ? (
            <div className="prose max-w-none">
              {content.split("\n").map((line, index) => {
                if (line.startsWith("# ")) {
                  return <h3 key={index}>{line.replace("# ", "")}</h3>
                } else if (line.startsWith("## ")) {
                  return <h4 key={index}>{line.replace("## ", "")}</h4>
                } else if (line.startsWith("- ")) {
                  return <li key={index}>{line.replace("- ", "")}</li>
                } else if (line.trim() === "") {
                  return <br key={index} />
                } else {
                  return <p key={index}>{line}</p>
                }
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-8 rounded-lg text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No insights generated yet</h3>
                <p className="text-muted-foreground">Send a message in the chat to generate insights.</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="font-medium">Generating Approach Insights...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a few moments</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </>
  )
})

ApproachInsights.displayName = "ApproachInsights"

export default ApproachInsights

