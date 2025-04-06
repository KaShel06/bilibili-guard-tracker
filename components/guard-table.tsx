import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ParsedGuardUser } from "@/lib/bilibili"
import { getGuardLevelName, getGuardLevelColor } from "@/lib/utils"
import Image from "next/image"

interface GuardTableProps {
  guards: ParsedGuardUser[]
  showFull?: boolean
}

export function GuardTable({ guards, showFull = false }: GuardTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">排名</TableHead>
            <TableHead>用户</TableHead>
            <TableHead>等级</TableHead>
            <TableHead>牌子</TableHead>
            {showFull && <TableHead>UID</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {guards.map((guard) => (
            <TableRow key={guard.uid}>
              <TableCell className="font-medium">{guard.rank}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {guard.face && (
                    <Image
                      src={guard.face || "/placeholder.svg"}
                      alt={guard.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>{guard.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge style={{ backgroundColor: getGuardLevelColor(guard.guard_level) }} className="text-white">
                  {getGuardLevelName(guard.guard_level)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {guard.medal_name} Lv.{guard.level}
                </span>
              </TableCell>
              {showFull && <TableCell>{guard.uid}</TableCell>}
            </TableRow>
          ))}
          {guards.length === 0 && (
            <TableRow>
              <TableCell colSpan={showFull ? 5 : 4} className="text-center py-4">
                No guard data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

