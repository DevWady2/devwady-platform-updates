import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, Pencil, Layers, Play } from "lucide-react";
import { useState } from "react";
import { useInstructorCourses } from "@/portals/academy/hooks/useInstructorCourses";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "published" | "draft";

export default function InstructorWorkspaceCourses() {
  const { data: courses = [], isLoading } = useInstructorCourses();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filter === "all"
    ? courses
    : courses.filter((c) => c.status === filter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your courses, lessons, and students
          </p>
        </div>
        <Button asChild>
          <Link to="/instructor/workspace/courses/new">
            <Plus className="mr-1.5 h-4 w-4" /> New Course
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({courses.length})</TabsTrigger>
          <TabsTrigger value="published">
            Published ({courses.filter((c) => c.status === "published").length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({courses.filter((c) => c.status === "draft").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No courses created yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first course to start teaching
            </p>
            <Button asChild className="mt-6">
              <Link to="/instructor/workspace/courses/new">
                <Plus className="mr-1.5 h-4 w-4" /> Create Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} className="flex flex-col">
              {/* Thumbnail */}
              {course.thumbnail_url && (
                <div className="relative h-36 overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title_en ?? ""}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <CardContent className={`flex flex-1 flex-col gap-3 ${course.thumbnail_url ? "pt-4" : "pt-6"}`}>
                {/* Title + badges */}
                <div className="space-y-1.5">
                  <h3 className="line-clamp-2 font-semibold leading-snug">
                    {course.title_en}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={course.status === "published" ? "default" : "secondary"} className="text-xs">
                      {course.status}
                    </Badge>
                    {course.learning_product_type && (
                      <Badge variant="outline" className="text-xs">
                        {course.learning_product_type}
                      </Badge>
                    )}
                    {course.delivery_mode && (
                      <Badge variant="outline" className="text-xs">
                        {course.delivery_mode}
                      </Badge>
                    )}
                    {course.is_free && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {course.total_lessons != null && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> {course.total_lessons} lessons
                    </span>
                  )}
                  {course.price_usd != null && !course.is_free && (
                    <span>${course.price_usd}</span>
                  )}
                </div>

                {/* Management links */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2 border-t">
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/instructor/workspace/courses/${course.id}/edit`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/instructor/workspace/courses/${course.id}/lessons`}>
                      <BookOpen className="mr-1 h-3.5 w-3.5" /> Lessons
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/instructor/workspace/courses/${course.id}/structure`}>
                      <Layers className="mr-1 h-3.5 w-3.5" /> Structure
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/instructor/workspace/courses/${course.id}/delivery`}>
                      <Play className="mr-1 h-3.5 w-3.5" /> Delivery
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/instructor/workspace/courses/${course.id}/students`}>
                      <Users className="mr-1 h-3.5 w-3.5" /> Students
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
