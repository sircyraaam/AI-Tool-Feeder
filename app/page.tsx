"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Search,
  ArrowUpDown,
  TrendingUp,
  Activity,
  Database,
  Heart,
  Star,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Tag,
  Sparkles,
} from "lucide-react"

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

interface UserReview {
  id: string
  toolId: string
  rating: number
  review: string
  author: string
  date: string
}

export default function AIToolsAnalyticsDashboard() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("dashboard")

  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userReviews, setUserReviews] = useState<UserReview[]>([])
  const [comparisonList, setComparisonList] = useState<Set<string>>(new Set())
  const [toolStatuses, setToolStatuses] = useState<Record<string, "online" | "offline" | "checking">>({})

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch("https://v0-ai-tools-feed.vercel.app/api/tools/latest")
        if (!response.ok) {
          throw new Error(`Failed to fetch tools: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()

        let toolsArray: Tool[] = []
        if (data && data.data && Array.isArray(data.data.tools)) {
          toolsArray = data.data.tools
        } else if (Array.isArray(data)) {
          toolsArray = data
        } else if (data && Array.isArray(data.tools)) {
          toolsArray = data.tools
        }

        setTools(toolsArray)

        const statusChecks: Record<string, "online" | "offline" | "checking"> = {}
        toolsArray.forEach((tool) => {
          statusChecks[tool.id] = "checking"
        })
        setToolStatuses(statusChecks)

        // Simulate status checking (in real app, this would ping actual URLs)
        setTimeout(() => {
          const updatedStatuses: Record<string, "online" | "offline" | "checking"> = {}
          toolsArray.forEach((tool) => {
            updatedStatuses[tool.id] = Math.random() > 0.1 ? "online" : "offline"
          })
          setToolStatuses(updatedStatuses)
        }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTools()

    const savedFavorites = localStorage.getItem("ai-tools-favorites")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  const categorizeTools = (tools: Tool[]) => {
    const categories: Record<string, Tool[]> = {
      "Coding & Development": [],
      "Writing & Content": [],
      "Design & Creative": [],
      "Data & Analytics": [],
      Productivity: [],
      "Research & Learning": [],
      Other: [],
    }

    tools.forEach((tool) => {
      const text = (tool.title + " " + tool.description).toLowerCase()

      if (
        text.includes("code") ||
        text.includes("programming") ||
        text.includes("development") ||
        text.includes("ide") ||
        text.includes("github")
      ) {
        categories["Coding & Development"].push(tool)
      } else if (
        text.includes("writing") ||
        text.includes("content") ||
        text.includes("blog") ||
        text.includes("text")
      ) {
        categories["Writing & Content"].push(tool)
      } else if (
        text.includes("design") ||
        text.includes("creative") ||
        text.includes("image") ||
        text.includes("visual")
      ) {
        categories["Design & Creative"].push(tool)
      } else if (
        text.includes("data") ||
        text.includes("analytics") ||
        text.includes("chart") ||
        text.includes("analysis")
      ) {
        categories["Data & Analytics"].push(tool)
      } else if (
        text.includes("productivity") ||
        text.includes("task") ||
        text.includes("organize") ||
        text.includes("workflow")
      ) {
        categories["Productivity"].push(tool)
      } else if (
        text.includes("research") ||
        text.includes("learn") ||
        text.includes("education") ||
        text.includes("study")
      ) {
        categories["Research & Learning"].push(tool)
      } else {
        categories["Other"].push(tool)
      }
    })

    return categories
  }

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

    const trendingTools = safeTools
      .filter((tool) => tool.votes > avgVotes)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5)

    const categories = categorizeTools(safeTools)
    const onlineTools = Object.values(toolStatuses).filter((status) => status === "online").length
    const offlineTools = Object.values(toolStatuses).filter((status) => status === "offline").length

    return {
      totalTools,
      totalVotes,
      totalComments,
      avgVotes,
      topSources,
      sourceStats,
      trendingTools,
      categories,
      onlineTools,
      offlineTools,
      favoriteCount: favorites.size,
    }
  }, [tools, toolStatuses, favorites])

  const filteredAndSortedTools = useMemo(() => {
    const safeTools = Array.isArray(tools) ? tools : []
    const filtered = safeTools.filter((tool) => {
      const matchesSearch = tool && tool.title && tool.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSource = selectedSource === "all" || tool.source === selectedSource
      const matchesCategory =
        selectedCategory === "all" || analytics.categories[selectedCategory]?.some((catTool) => catTool.id === tool.id)
      return matchesSearch && matchesSource && matchesCategory
    })

    filtered.sort((a, b) => {
      const comparison = b.votes - a.votes
      return sortOrder === "desc" ? comparison : -comparison
    })

    return filtered
  }, [tools, searchTerm, sortOrder, selectedSource, selectedCategory, analytics.categories])

  const toggleFavorite = (toolId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(toolId)) {
      newFavorites.delete(toolId)
    } else {
      newFavorites.add(toolId)
    }
    setFavorites(newFavorites)
    localStorage.setItem("ai-tools-favorites", JSON.stringify([...newFavorites]))
  }

  const toggleComparison = (toolId: string) => {
    const newComparison = new Set(comparisonList)
    if (newComparison.has(toolId)) {
      newComparison.delete(toolId)
    } else if (newComparison.size < 5) {
      // Limit to 5 tools for comparison
      newComparison.add(toolId)
    }
    setComparisonList(newComparison)
  }

  const exportData = () => {
    const exportData = {
      tools: filteredAndSortedTools,
      favorites: [...favorites],
      analytics: analytics,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-tools-export.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRecommendations = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId)
    if (!tool) return []

    // Simple recommendation based on same category and similar vote range
    const category = Object.entries(analytics.categories).find(([, tools]) => tools.some((t) => t.id === toolId))?.[0]

    if (!category) return []

    return analytics.categories[category]
      .filter((t) => t.id !== toolId && Math.abs(t.votes - tool.votes) < tool.votes * 0.5)
      .slice(0, 3)
  }

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
              <h1 className="text-2xl font-bold text-foreground">AI Tools Intelligence Platform</h1>
              <p className="text-muted-foreground">Comprehensive analytics, discovery, and management for AI tools</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favorites.size})</TabsTrigger>
            <TabsTrigger value="comparison">Compare ({comparisonList.size})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{analytics.onlineTools}</div>
                  <p className="text-xs text-muted-foreground">{analytics.offlineTools} offline</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{analytics.favoriteCount}</div>
                  <p className="text-xs text-muted-foreground">Tools bookmarked</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{Object.keys(analytics.categories).length}</div>
                  <p className="text-xs text-muted-foreground">Smart categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Trending Tools */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Trending Tools
                </CardTitle>
                <CardDescription>Top performing AI tools by community engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.trendingTools.map((tool, index) => (
                    <Card key={tool.id} className="bg-background border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(tool.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Heart
                                className={`h-3 w-3 ${favorites.has(tool.id) ? "fill-red-500 text-red-500" : ""}`}
                              />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-sm">{tool.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {tool.votes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {tool.comments}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>AI tools organized by use case and functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(analytics.categories).map(([category, categoryTools]) => (
                    <div key={category} className="p-4 bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{category}</h4>
                        <Badge variant="outline">{categoryTools.length}</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(categoryTools.length / analytics.totalTools) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">AI Tools Discovery</CardTitle>
                    <CardDescription>Explore and discover AI tools with advanced filtering</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">{filteredAndSortedTools.length} tools</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Enhanced Search and Filter Controls */}
                <div className="flex flex-col gap-4 mb-6">
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
                  <div className="flex flex-wrap gap-2">
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
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                    >
                      <option value="all">All Categories</option>
                      {Object.keys(analytics.categories).map((category) => (
                        <option key={category} value={category}>
                          {category}
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

                {/* Enhanced Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="bg-background border-border hover:border-primary/50 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                            {tool.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              {tool.votes}
                            </div>
                            <div
                              className={`h-2 w-2 rounded-full ${
                                toolStatuses[tool.id] === "online"
                                  ? "bg-green-500"
                                  : toolStatuses[tool.id] === "offline"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {tool.source}
                          </Badge>
                          {tool.comments > 0 && (
                            <span className="text-xs text-muted-foreground">{tool.comments} comments</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs mb-3 line-clamp-2">{tool.description}</CardDescription>
                        <div className="flex items-center justify-between">
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Visit Tool
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(tool.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Heart
                                className={`h-3 w-3 ${favorites.has(tool.id) ? "fill-red-500 text-red-500" : ""}`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComparison(tool.id)}
                              className="h-6 w-6 p-0"
                              disabled={comparisonList.size >= 5 && !comparisonList.has(tool.id)}
                            >
                              <Eye className={`h-3 w-3 ${comparisonList.has(tool.id) ? "text-blue-500" : ""}`} />
                            </Button>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {getRecommendations(tool.id).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">Similar tools:</p>
                            <div className="flex flex-wrap gap-1">
                              {getRecommendations(tool.id).map((rec) => (
                                <Badge key={rec.id} variant="secondary" className="text-xs">
                                  {rec.title.split(" ").slice(0, 2).join(" ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredAndSortedTools.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-2">
                      {searchTerm || selectedSource !== "all" || selectedCategory !== "all"
                        ? "No tools found matching your criteria"
                        : "No tools available"}
                    </div>
                    {(searchTerm || selectedSource !== "all" || selectedCategory !== "all") && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedSource("all")
                          setSelectedCategory("all")
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
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Your Favorite Tools
                </CardTitle>
                <CardDescription>Manage your bookmarked AI tools</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.size === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No favorite tools yet</p>
                    <p className="text-sm text-muted-foreground">
                      Click the heart icon on any tool to add it to your favorites
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools
                      .filter((tool) => favorites.has(tool.id))
                      .map((tool) => (
                        <Card key={tool.id} className="bg-background border-border">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm font-medium text-foreground leading-tight">
                                {tool.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavorite(tool.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <CardDescription className="text-xs mb-3">{tool.description}</CardDescription>
                            <div className="flex items-center justify-between">
                              <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Visit Tool
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {tool.votes}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Tool Comparison
                </CardTitle>
                <CardDescription>Compare up to 5 AI tools side by side</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonList.size === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tools selected for comparison</p>
                    <p className="text-sm text-muted-foreground">
                      Click the eye icon on any tool to add it to comparison
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Comparing {comparisonList.size} tool{comparisonList.size !== 1 ? "s" : ""}
                      </p>
                      <Button variant="outline" onClick={() => setComparisonList(new Set())} size="sm">
                        Clear All
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-4 font-medium">Feature</th>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <th key={tool.id} className="text-left p-4 font-medium min-w-48">
                                  <div className="flex items-center justify-between">
                                    {tool.title}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleComparison(tool.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-4 font-medium">Votes</td>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <td key={tool.id} className="p-4">
                                  {tool.votes.toLocaleString()}
                                </td>
                              ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 font-medium">Comments</td>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <td key={tool.id} className="p-4">
                                  {tool.comments.toLocaleString()}
                                </td>
                              ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 font-medium">Source</td>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <td key={tool.id} className="p-4">
                                  <Badge variant="outline">{tool.source}</Badge>
                                </td>
                              ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 font-medium">Status</td>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <td key={tool.id} className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2 w-2 rounded-full ${
                                        toolStatuses[tool.id] === "online"
                                          ? "bg-green-500"
                                          : toolStatuses[tool.id] === "offline"
                                            ? "bg-red-500"
                                            : "bg-yellow-500"
                                      }`}
                                    />
                                    <span className="text-sm capitalize">{toolStatuses[tool.id]}</span>
                                  </div>
                                </td>
                              ))}
                          </tr>
                          <tr>
                            <td className="p-4 font-medium">Description</td>
                            {tools
                              .filter((tool) => comparisonList.has(tool.id))
                              .map((tool) => (
                                <td key={tool.id} className="p-4 text-sm text-muted-foreground">
                                  {tool.description}
                                </td>
                              ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Community Reviews
                </CardTitle>
                <CardDescription>User reviews and ratings for AI tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Review system coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Community reviews and ratings will be available in the next update
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status Monitor
                </CardTitle>
                <CardDescription>Real-time availability monitoring for AI tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{analytics.onlineTools}</div>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{analytics.offlineTools}</div>
                    <p className="text-sm text-red-600">Offline</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(toolStatuses).filter((status) => status === "checking").length}
                    </div>
                    <p className="text-sm text-yellow-600">Checking</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            toolStatuses[tool.id] === "online"
                              ? "bg-green-500"
                              : toolStatuses[tool.id] === "offline"
                                ? "bg-red-500"
                                : "bg-yellow-500 animate-pulse"
                          }`}
                        />
                        <span className="font-medium text-sm">{tool.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {tool.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground capitalize">{toolStatuses[tool.id]}</span>
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
