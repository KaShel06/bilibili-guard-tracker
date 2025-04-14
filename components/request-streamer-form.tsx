"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  roomId: z.string().min(1, {
    message: "房间号不能为空",
  }),
})

interface RequestStreamerFormProps {
  onSuccess?: () => void
  isAdmin?: boolean
}

export function RequestStreamerForm({ onSuccess, isAdmin = false }: RequestStreamerFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      
      // 根据是否为管理员决定使用哪个API
      const endpoint = isAdmin ? "/api/streamers" : "/api/requests"
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: values.roomId,
          type: "streamer"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "添加失败")
      }

      toast({
        title: isAdmin ? "添加成功" : "请求已提交",
        description: isAdmin 
          ? `已成功添加主播 ${data.streamer?.name || values.roomId}`
          : "您的添加主播请求已提交，等待管理员审核",
      })

      form.reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error adding streamer:", error)
      toast({
        title: isAdmin ? "添加失败" : "请求提交失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{isAdmin ? "添加主播" : "请求添加主播"}</CardTitle>
        <CardDescription>
          {isAdmin 
            ? "输入B站直播间ID添加主播" 
            : "提交请求添加新主播，等待管理员审核"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>B站直播间ID</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: 21452505" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAdmin ? "添加中..." : "提交中..."}
                </>
              ) : (
                isAdmin ? "添加主播" : "提交请求"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}