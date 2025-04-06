import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuardChange } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { getGuardLevelName, getGuardLevelColor } from "@/lib/utils"

interface ChangesTableProps {
  changes: GuardChange[]
  showFull?: boolean
}

export function ChangesTable({ changes, showFull = false }: ChangesTableProps) {
  if (changes.length === 0) {
    return <div className="text-center py-4 border rounded-md">No changes detected</div>
  }

  return (
    <div className="space-y-6">
      {changes.map((change, index) => (
        <div key={index} className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 p-3 font-medium">{formatDate(change.timestamp)}</div>

          {change.added.length > 0 && (
            <div className="p-3 border-b">
              <h4 className="font-medium text-green-600 mb-2">新增大航海 ({change.added.length})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>牌子</TableHead>
                    {showFull && <TableHead>UID</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {change.added.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: getGuardLevelColor(user.guard_level) }} className="text-white">
                          {getGuardLevelName(user.guard_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.medal_name} Lv.{user.level}
                      </TableCell>
                      {showFull && <TableCell>{user.uid}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {change.removed.length > 0 && (
            <div className="p-3">
              <h4 className="font-medium text-red-600 mb-2">退出大航海 ({change.removed.length})</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>牌子</TableHead>
                    {showFull && <TableHead>UID</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {change.removed.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: getGuardLevelColor(user.guard_level) }} className="text-white">
                          {getGuardLevelName(user.guard_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.medal_name} Lv.{user.level}
                      </TableCell>
                      {showFull && <TableCell>{user.uid}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

