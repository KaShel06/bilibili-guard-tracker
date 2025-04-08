"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddStreamerFormProps {
  onSuccess?: () => void
}

interface StreamerInput {
  roomId: string
  name: string
}

export function AddStreamerForm({ onSuccess }: AddStreamerFormProps) {
  const [streamers, setStreamers] = useState<StreamerInput[]>([{ roomId: "", name: "" }])
  const [bulkInput, setBulkInput] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("manual")

  const addStreamerField = () => {
    setStreamers([...streamers, { roomId: "", name: "" }])
  }

  const removeStreamerField = (index: number) => {
    if (streamers.length > 1) {
      const newStreamers = [...streamers]
      newStreamers.splice(index, 1)
      setStreamers(newStreamers)
    }
  }

  const updateStreamerField = (index: number, field: keyof StreamerInput, value: string) => {
    const newStreamers = [...streamers]
    newStreamers[index][field] = value
    setStreamers(newStreamers)
  }

  const processBulkInput = (input: string) => {
    // Split by common separators (newlines, commas, spaces) and filter out empty entries
    const roomIds = input
      .split(/[\n,\s]+/)
      .map(id => id.trim())
      .filter(id => id !== "")
      .filter(id => /^\d+$/.test(id)) // Only keep numeric IDs

    if (roomIds.length === 0) {
      return []
    }

    // Convert to streamer inputs
    return roomIds.map(roomId => ({ roomId, name: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      let validStreamers: StreamerInput[] = []
      
      if (activeTab === "manual") {
        // Filter out empty entries from manual input
        validStreamers = streamers.filter(s => s.roomId.trim() !== "")
      } else {
        // Process bulk input directly
        validStreamers = processBulkInput(bulkInput)
      }
      
      if (validStreamers.length === 0) {
        throw new Error("请至少添加一个有效的房间号")
      }

      // Add streamers one by one
      for (const streamer of validStreamers) {
        const response = await fetch("/api/streamers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(streamer),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(`房间号 ${streamer.roomId} 添加失败: ${data.error || "未知错误"}`)
        }
      }

      // Reset form
      setStreamers([{ roomId: "", name: "" }])
      setBulkInput("")
      onSuccess?.()
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加主播</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="manual" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">手动添加</TabsTrigger>
              <TabsTrigger value="bulk">批量导入</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                {streamers.map((streamer, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`roomId-${index}`}>房间号</Label>
                      <Input
                        id={`roomId-${index}`}
                        value={streamer.roomId}
                        onChange={(e) => updateStreamerField(index, "roomId", e.target.value)}
                        placeholder="例如: 1849256543"
                        required={index === 0}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`name-${index}`}>主播名称 (可选)</Label>
                      <Input 
                        id={`name-${index}`} 
                        value={streamer.name} 
                        onChange={(e) => updateStreamerField(index, "name", e.target.value)} 
                        placeholder="例如: 某某主播" 
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeStreamerField(index)}
                      disabled={streamers.length === 1}
                      className="mb-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={addStreamerField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加更多主播
              </Button>
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkInput">批量输入房间号</Label>
                <Textarea 
                  id="bulkInput"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="输入多个房间号，用逗号、空格或换行分隔，例如:&#10;1849256543&#10;2222222&#10;3333333"
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  直接输入多个房间号，点击下方"添加主播"按钮即可批量添加
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              "添加主播"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

