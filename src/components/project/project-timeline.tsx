'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';

interface Milestone {
  id: number;
  milestone_name: string;
  description: string;
  due_date: string;
  completed_date: string | null;
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  checklist_items: any[];
  completion_percentage: number;
  is_critical: boolean;
}

interface ProjectTimelineProps {
  project: {
    id: number;
    project_name: string;
    start_date: string;
    target_completion_date: string;
    actual_completion_date: string | null;
    status: string;
    progress_percentage: number;
    milestones: Milestone[];
  };
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'blocked': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      case 'in_progress': return <Play className="h-4 w-4 text-muted-foreground" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      case 'cancelled': return <Pause className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const calculatePosition = (date: string) => {
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.target_completion_date);
    const currentDate = new Date(date);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const currentPosition = currentDate.getTime() - startDate.getTime();
    
    const percentage = Math.max(0, Math.min(100, (currentPosition / totalDuration) * 100));
    return percentage;
  };

  const sortedMilestones = [...project.milestones].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const today = new Date();
  const todayPosition = calculatePosition(today.toISOString());

  const completedCount = project.milestones.filter(m => m.status === 'completed').length;
  const inProgressCount = project.milestones.filter(m => m.status === 'in_progress').length;
  const overdueCount = project.milestones.filter(m => isOverdue(m.due_date, m.status)).length;
  const criticalCount = project.milestones.filter(m => m.is_critical).length;

  return (
    <div className="space-y-6">
      {/* Timeline Statistics - Following admin dashboard pattern */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              {project.milestones.length > 0 ? Math.round((completedCount / project.milestones.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            {formatDate(project.start_date)} - {formatDate(project.target_completion_date)}
            {project.actual_completion_date && (
              <span className="ml-2 text-green-600">
                • Completed {formatDate(project.actual_completion_date)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{project.progress_percentage}%</span>
            </div>
            <Progress value={project.progress_percentage} className="h-2" />
          </div>

          <Separator />

          {/* Visual Timeline */}
          <div className="space-y-6">
            <div className="relative">
              {/* Timeline Base */}
              <div className="relative bg-muted h-1 rounded-full">
                {/* Progress Bar */}
                <div 
                  className="absolute top-0 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${project.progress_percentage}%` }}
                />
                
                {/* Today Marker */}
                {todayPosition >= 0 && todayPosition <= 100 && (
                  <>
                    <div 
                      className="absolute top-0 h-1 w-0.5 bg-destructive"
                      style={{ left: `${todayPosition}%` }}
                    />
                    <div 
                      className="absolute -top-5 text-xs text-destructive font-medium whitespace-nowrap"
                      style={{ left: `${todayPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      Today
                    </div>
                  </>
                )}
              </div>

              {/* Timeline Labels */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatDateShort(project.start_date)}</span>
                <span>{formatDateShort(project.target_completion_date)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Detailed view of all project milestones and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMilestones.length > 0 ? (
            <div className="space-y-4">
              {sortedMilestones.map((milestone, index) => {
                const overdue = isOverdue(milestone.due_date, milestone.status);
                
                return (
                  <div key={milestone.id}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="mt-1">
                        {getStatusIcon(milestone.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{milestone.milestone_name}</h4>
                          <Badge variant={getStatusBadgeVariant(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                          {milestone.is_critical && (
                            <Badge variant="outline" className="text-xs">
                              Critical
                            </Badge>
                          )}
                          {overdue && milestone.status !== 'completed' && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {formatDate(milestone.due_date)}
                          </span>
                          {milestone.assigned_to_name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {milestone.assigned_to_name}
                            </span>
                          )}
                          {milestone.completed_date && (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed {formatDate(milestone.completed_date)}
                            </span>
                          )}
                        </div>
                        
                        {milestone.status !== 'completed' && milestone.completion_percentage > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{milestone.completion_percentage}%</span>
                            </div>
                            <Progress value={milestone.completion_percentage} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                    {index < sortedMilestones.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No milestones defined for this project</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTimeline;
