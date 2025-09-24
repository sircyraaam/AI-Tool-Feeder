"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Search, ArrowUpDown, TrendingUp, BarChart3, Globe, Activity, Database } from "lucide-react"

interface Tool {
  id: string
  title: string
  description: string
  url: string
  source: string
  tags: string[]
  votes: number
  comments: number
  createdAt: string
  scrapedAt: string
}

export default function AIToolsAnalyticsDashboard() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedSource, setSelectedSource] = useState<string>("all")

  useEffect(() => {
    const fetchTools = async () => {
      try {
        console.log("[v0] Fetching AI tools data...")
        const response = await fetch("https://v0-ai-tools-feed.vercel.app/api/tools/latest")
        if (!response.ok) {
          throw new Error(`Failed to fetch tools: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        console.log("[v0] API Response:", data)

        let toolsArray: Tool[] = []
        if (data && data.data && Array.isArray(data.data.tools)) {
          toolsArray = data.data.tools
        } else if (Array.isArray(data)) {
          toolsArray = data
        } else if (data && Array.isArray(data.tools)) {
          toolsArray = data.tools
        }

        console.log("[v0] Processed tools array:", toolsArray.length, "tools")
        console.log(
          "[v0] All tool titles:",
          toolsArray.map((tool) => tool.title),
        )
        const lindyTool = toolsArray.find((tool) => tool.title.toLowerCase().includes("lindy"))
        if (lindyTool) {
          console.log("[v0] Found Lindy tool:", lindyTool)
        } else {
          console.log("[v0] Lindy.ai not found in current dataset")
        }
        setTools(toolsArray)
      } catch (err) {
        console.log("[v0] Error fetching tools:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [])

  const analytics = useMemo(() => {
    const safeTools = Array.isArray(tools) ? tools : []
    const totalTools = safeTools.length
    const totalVotes = safeTools.reduce((sum, tool) => sum + (tool.votes || 0), 0)
    const totalComments = safeTools.reduce((sum, tool) => sum + (tool.comments || 0), 0)

    const sourceStats = safeTools.reduce(
      (acc, tool) => {
        acc[tool.source] = (acc[tool.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topSources = Object.entries(sourceStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const avgVotes = totalTools > 0 ? Math.round(totalVotes / totalTools) : 0

    return {
      totalTools,
      totalVotes,
      totalComments,
      avgVotes,
      topSources,
      sourceStats,
    }
  }, [tools])

  const filteredAndSortedTools = useMemo(() => {
    const safeTools = Array.isArray(tools) ? tools : []
    const filtered = safeTools.filter((tool) => {
      const matchesSearch = tool && tool.title && tool.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSource = selectedSource === "all" || tool.source === selectedSource
      return matchesSearch && matchesSource
    })

    filtered.sort((a, b) => {
      const comparison = b.votes - a.votes
      return sortOrder === "desc" ? comparison : -comparison
    })

    return filtered
  }, [tools, searchTerm, sortOrder, selectedSource])

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading AI Tools Analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Tools Analytics</h1>
              <p className="text-muted-foreground">Real-time insights into the AI tools ecosystem</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live Data</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tools</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalTools.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active AI tools tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalVotes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Community engagement</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Votes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.avgVotes}</div>
              <p className="text-xs text-muted-foreground">Per tool average</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Sources</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.topSources.length}</div>
              <p className="text-xs text-muted-foreground">Active platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Data Sources</CardTitle>
              <CardDescription>Distribution of AI tools by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topSources.map(([source, count], index) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full bg-primary"
                        style={{
                          backgroundColor: `hsl(${220 + index * 40}, 70%, 50%)`,
                        }}
                      ></div>
                      <span className="text-sm font-medium text-foreground">{source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / analytics.totalTools) * 100}%`,
                            backgroundColor: `hsl(${220 + index * 40}, 70%, 50%)`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Stats</CardTitle>
              <CardDescription>Platform insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Most Active</span>
                <span className="text-sm font-medium text-foreground">{analytics.topSources[0]?.[0] || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Comments</span>
                <span className="text-sm font-medium text-foreground">{analytics.totalComments.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engagement Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {analytics.totalTools > 0
                    ? Math.round((analytics.totalComments / analytics.totalTools) * 100) / 100
                    : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Table Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">AI Tools Database</CardTitle>
                <CardDescription>Browse and analyze the complete AI tools dataset</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{filteredAndSortedTools.length} tools</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search AI tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                >
                  <option value="all">All Sources</option>
                  {analytics.topSources.map(([source]) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={toggleSort}
                  className="flex items-center gap-2 whitespace-nowrap bg-transparent"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Votes {sortOrder === "desc" ? "↓" : "↑"}
                </Button>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedTools.map((tool) => (
                <Card key={tool.id} className="bg-background border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                        {tool.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <TrendingUp className="h-3 w-3" />
                        {tool.votes}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {tool.source}
                      </span>
                      {tool.comments > 0 && (
                        <span className="text-xs text-muted-foreground">{tool.comments} comments</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs mb-3 line-clamp-2">{tool.description}</CardDescription>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Visit Tool
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAndSortedTools.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-2">
                  {searchTerm || selectedSource !== "all"
                    ? "No tools found matching your criteria"
                    : "No tools available"}
                </div>
                {(searchTerm || selectedSource !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedSource("all")
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
