"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { StreamerInfo, GuardSnapshot } from "@/lib/db"
import { StreamerCard } from "@/components/streamer-card"
import { PublicStreamerCard } from "@/components/public-streamer-card"
import { RequestStreamerForm } from "@/components/request-streamer-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Tag, Filter, Eye } from "lucide-react"
import { TagFilter } from "@/components/tag-filter"

export function StreamerListClient() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  
  const [streamers, setStreamers] = useState<StreamerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filteredStreamers, setFilteredStreamers] = useState<StreamerInfo[]>([])
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{streamer: StreamerInfo, snapshot: GuardSnapshot | null}[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  useEffect(() => {
    fetchStreamers()
    fetchAllTags()
    if (isAdmin) {
      fetchPendingRequests()
    }
  }, [isAdmin])

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredStreamers(streamers)
    } else {
      filterStreamersByTags()
    }
  }, [selectedTags, streamers])

  const fetchStreamers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/streamers/public")
      const data = await response.json()
      setStreamers(data.streamers || [])
      setFilteredStreamers(data.streamers || [])
    } catch (error) {
      console.error("Error fetching streamers:", error)
      toast({
        title: "获取主播列表失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTags = async () => {
    try {
      const response = await fetch("/api/tags")
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const fetchPendingRequests = async () => {
    if (!isAdmin) return
    
    try {
      setLoadingRequests(true)
      const response = await fetch("/api/requests")
      const data = await response.json()
      setPendingRequests(data.requests || [])
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const filterStreamersByTags = async () => {
    if (selectedTags.length === 0) {
      setFilteredStreamers(streamers)
      return
    }

    try {
      const response = await fetch("/api/streamers/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      })
      const data = await response.json()
      setFilteredStreamers(data.streamers || [])
    } catch (error) {
      console.error("Error filtering streamers:", error)
      toast({
        title: "筛选主播失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handlePreviewData = async () => {
    if (selectedTags.length === 0) return

    try {
      setPreviewLoading(true)
      const response = await fetch("/api/streamers/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      })
      const data = await response.json()
      setPreviewData(data.summary || [])
      setPreviewDialogOpen(true)
    } catch (error) {
      toast({
        title: "获取预览数据失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    if (!isAdmin) return
    
    try {
      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("审批请求失败")
      }
      
      toast({
        title: "审批成功",
        description: "已成功添加主播或标签",
      })
      
      // 刷新数据
      fetchPendingRequests()
      fetchStreamers()
      fetchAllTags()
    } catch (error) {
      toast({
        title: "审批失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!isAdmin) return
    
    try {
      const response = await fetch(`/api/requests/${requestId}/reject`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("拒绝请求失败")
      }
      
      toast({
        title: "已拒绝请求",
        description: "已成功拒绝该请求",
      })
      
      // 刷新请求列表
      fetchPendingRequests()
    } catch (error) {
      toast({
        title: "操作失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Tabs defaultValue="streamers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="streamers">主播列表</TabsTrigger>
          {isAdmin && <TabsTrigger value="requests">待审核请求</TabsTrigger>}
        </TabsList>

        <TabsContent value="streamers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  主播列表 
                  {selectedTags.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      (已筛选: {filteredStreamers.length} 个主播)
                    </span>
                  )}
                </h2>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredStreamers.length > 0 ? (
                    filteredStreamers.map((streamer) => (
                      isAdmin ? (
                        <StreamerCard
                          key={streamer.roomId}
                          streamer={streamer}
                          isAdmin={true}
                          onManageTags={(updatedStreamer) => {
                            if (updatedStreamer) {
                              setStreamers(prev => 
                                prev.map(s => 
                                  s.roomId === updatedStreamer.roomId ? updatedStreamer : s
                                )
                              );
                            }
                            fetchAllTags();
                          }}
                          allTags={allTags}
                          onCreateTag={async (tag) => {
                            try {
                              const response = await fetch("/api/tags", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ tag }),
                              });
                              
                              if (!response.ok) {
                                throw new Error("创建标签失败");
                              }
                              
                              await fetchAllTags();
                              return true;
                            } catch (error) {
                              toast({
                                title: "创建标签失败",
                                description: (error as Error).message,
                                variant: "destructive",
                              });
                              return false;
                            }
                          }}
                        />
                      ) : (
                        <PublicStreamerCard
                          key={streamer.roomId}
                          streamer={streamer}
                          onRequestTag={async (tag) => {
                            try {
                              const response = await fetch("/api/requests", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ 
                                  type: "tag", 
                                  roomId: streamer.roomId,
                                  tag 
                                }),
                              });
                              
                              if (!response.ok) {
                                throw new Error("请求添加标签失败");
                              }
                              
                              toast({
                                title: "请求已提交",
                                description: "您的标签添加请求已提交，等待管理员审核",
                              });
                              
                              return true;
                            } catch (error) {
                              toast({
                                title: "请求失败",
                                description: (error as Error).message,
                                variant: "destructive",
                              });
                              return false;
                            }
                          }}
                        />
                      )
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border rounded-md">
                      <p className="text-gray-500">
                        {selectedTags.length > 0 ? "没有符合筛选条件的主播" : "暂无追踪的主播"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                {isAdmin ? "添加主播" : "请求添加主播"}
              </h2>
              <RequestStreamerForm 
                isAdmin={isAdmin}
                onSuccess={() => {
                  fetchStreamers()
                  if (isAdmin) {
                    fetchPendingRequests()
                  }
                }} 
              />
              
              {/* 添加标签筛选组件 */}
              <TagFilter 
                allTags={allTags}
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
                onClearTags={() => setSelectedTags([])}
                onPreviewData={handlePreviewData}
                previewLoading={previewLoading}
                previewDialogOpen={previewDialogOpen}
                setPreviewDialogOpen={setPreviewDialogOpen}
                previewData={previewData}
                isAdmin={isAdmin}
                onCreateTag={isAdmin ? async (tag) => {
                  try {
                    const response = await fetch("/api/tags", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ tag }),
                    });
                    
                    if (!response.ok) {
                      throw new Error("创建标签失败");
                    }
                    
                    await fetchAllTags();
                    return true;
                  } catch (error) {
                    toast({
                      title: "创建标签失败",
                      description: (error as Error).message,
                      variant: "destructive",
                    });
                    return false;
                  }
                } : undefined}
                onDeleteTag={isAdmin ? async (tag) => {
                  try {
                    const response = await fetch("/api/tags", {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ tag }),
                    });
                    
                    if (!response.ok) {
                      throw new Error("删除标签失败");
                    }
                    
                    await fetchAllTags();
                    return true;
                  } catch (error) {
                    toast({
                      title: "删除标签失败",
                      description: (error as Error).message,
                      variant: "destructive",
                    });
                    return false;
                  }
                } : undefined}
              />
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="requests" className="space-y-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">待审核请求</h2>
              
              {loadingRequests ? (
                <div className="flex items-center justify-center py-12 border rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载中...</span>
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex justify-between">
                          <span>
                            {request.type === 'streamer' ? '添加主播请求' : '添加标签请求'}
                          </span>
                          <Badge>{new Date(request.createdAt).toLocaleString()}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {request.type === 'streamer' ? (
                            <>
                              <p><strong>主播名称:</strong> {request.streamerName}</p>
                              <p><strong>房间号:</strong> {request.roomId}</p>
                            </>
                          ) : (
                            <>
                              <p><strong>主播房间号:</strong> {request.roomId}</p>
                              <p><strong>标签:</strong> {request.tag}</p>
                            </>
                          )}
                          
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              拒绝
                            </Button>
                            <Button 
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              批准
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md">
                  <p className="text-gray-500">暂无待审核请求</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}