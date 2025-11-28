"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, DollarSign, Users, Settings, ArrowRight, 
  CheckCircle2, XCircle, MoreVertical, MessageSquare, 
  MapPin, User, CheckCircle, Pin, PinOff, UserCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Problem, ProblemCategory } from "@/lib/problem-types";
import { getManagerForProblem } from "@/lib/problem-utils";
import { 
  ManagerAlertModal, 
  EmployeeAlertModal, 
  CommentModal, 
  AssignModal 
} from "./problem-modals";
import { useToast } from "@/components/ui/toast";

interface ProblemCenterProps {
  networkStatus: 'normal' | 'risks' | 'critical';
  notifications: Array<{
    id: string;
    message: string;
    href?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  problems: Problem[];
}

export function ProblemCenter({ networkStatus, notifications, problems }: ProblemCenterProps) {
  const [filter, setFilter] = useState<'all' | ProblemCategory>('all');
  const [resolvedProblems, setResolvedProblems] = useState<Set<string>>(new Set());
  const [pinnedProblems, setPinnedProblems] = useState<Set<string>>(new Set());
  const [problemsData, setProblemsData] = useState<Map<string, Problem>>(new Map());
  const [localSuccessBanner, setLocalSuccessBanner] = useState<boolean>(false);
  
  // Modal states
  const [managerAlertModal, setManagerAlertModal] = useState<{ isOpen: boolean; problem: Problem | null }>({ isOpen: false, problem: null });
  const [employeeAlertModal, setEmployeeAlertModal] = useState<{ isOpen: boolean; problem: Problem | null }>({ isOpen: false, problem: null });
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; problem: Problem | null }>({ isOpen: false, problem: null });
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; problem: Problem | null }>({ isOpen: false, problem: null });
  
  const { locations, employees, shifts, currentUser } = useStore();
  const router = useRouter();
  const { success, error } = useToast();

  // Initialize problems data
  useMemo(() => {
    const map = new Map<string, Problem>();
    problems.forEach(p => {
      map.set(p.id, { ...p, isPinned: pinnedProblems.has(p.id) });
    });
    setProblemsData(map);
  }, [problems, pinnedProblems]);

  // Combine notifications and problems
  const allProblems = useMemo(() => {
    // Convert notifications to Problem format (legacy support)
    const notificationProblems: Problem[] = notifications.map(notif => ({
      id: notif.id,
      title: notif.message,
      category: 'operations' as ProblemCategory,
      source: 'NO_MANAGER_ASSIGNED' as any,
      severity: notif.priority === 'high' ? 'critical' : notif.priority === 'medium' ? 'warning' : 'info',
      entityType: 'location',
      status: 'open',
      isPinned: pinnedProblems.has(notif.id),
      createdAt: new Date().toISOString()
    }));

    const all = [...problems, ...notificationProblems]
      // Don't filter resolved problems immediately - let them animate out
      .filter(p => {
        // Only filter if it's been resolved for more than 1 second (after animation)
        if (resolvedProblems.has(p.id)) {
          return true; // Keep for animation
        }
        return p.status !== 'resolved';
      })
      .map(p => {
        const existing = problemsData.get(p.id);
        return existing ? { ...p, ...existing } : p;
      });

    return all;
  }, [problems, notifications, resolvedProblems, pinnedProblems, problemsData]);

  // Filter and sort problems
  const filteredProblems = useMemo(() => {
    let filtered = filter === 'all' 
      ? allProblems 
      : allProblems.filter(item => item.category === filter);

    // Sort: isPinned → severity → createdAt
    filtered = [...filtered].sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by severity
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [allProblems, filter]);

  const typeIcons = {
    finance: DollarSign,
    personnel: Users,
    operations: Settings
  };

  const typeLabels = {
    finance: 'Финансы',
    personnel: 'Персонал',
    operations: 'Операции'
  };

  const severityColors = {
    critical: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
  };

  const statusConfig = {
    normal: {
      text: 'День в норме',
      description: 'Все показатели находятся в пределах нормы',
      icon: CheckCircle2,
      color: 'text-emerald-500'
    },
    risks: {
      text: 'Есть риски',
      description: 'Требуется внимание к некоторым показателям',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    critical: {
      text: 'Критично',
      description: 'Обнаружены критические проблемы',
      icon: XCircle,
      color: 'text-rose-500'
    }
  };

  const config = statusConfig[networkStatus];
  const StatusIcon = config.icon;

  // Get manager for problem
  const getManager = (problem: Problem) => {
    return getManagerForProblem(problem, shifts, locations, employees);
  };

  // Get employee for problem
  const getEmployee = (problem: Problem) => {
    if (!problem.employeeId) return null;
    return employees.find(e => e.id === problem.employeeId) || null;
  };

  // Handle actions
  const handleResolve = async (problem: Problem) => {
    // Optimistic update - mark as resolved immediately (triggers green highlight)
    setResolvedProblems(prev => new Set([...prev, problem.id]));

    // Show local success banner
    setLocalSuccessBanner(true);
    setTimeout(() => {
      setLocalSuccessBanner(false);
    }, 2500);

    try {
      // API call would go here
      // await resolveProblem(problem.id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // After green highlight (250ms) + collapse animation (300ms), update the data
      setTimeout(() => {
        setProblemsData(prev => {
          const newMap = new Map(prev);
          const updated = { ...problem, status: 'resolved' as const };
          newMap.set(problem.id, updated);
          return newMap;
        });
        
        // Remove from resolvedProblems after animation completes (allows AnimatePresence to handle exit)
        setTimeout(() => {
          setResolvedProblems(prev => {
            const newSet = new Set(prev);
            newSet.delete(problem.id);
            return newSet;
          });
        }, 300); // After exit animation
      }, 550); // Wait for animations to complete
    } catch (err) {
      // Rollback on error
      setResolvedProblems(prev => {
        const newSet = new Set(prev);
        newSet.delete(problem.id);
        return newSet;
      });
      setLocalSuccessBanner(false);
      // Show error toast (this one can stay global, bottom-right)
      error('Не удалось пометить как решённое. Попробуйте ещё раз.');
    }
  };

  const handlePin = async (problem: Problem) => {
    const newPinnedState = !problem.isPinned;
    setPinnedProblems(prev => {
      const newSet = new Set(prev);
      if (newPinnedState) {
        newSet.add(problem.id);
      } else {
        newSet.delete(problem.id);
      }
      return newSet;
    });
    setProblemsData(prev => {
      const newMap = new Map(prev);
      newMap.set(problem.id, { ...problem, isPinned: newPinnedState });
      return newMap;
    });

    try {
      // API call would go here
      // await pinProblem(problem.id, newPinnedState);
      success(newPinnedState ? 'Проблема закреплена' : 'Проблема откреплена');
    } catch (err) {
      error('Не удалось изменить статус закрепления');
    }
  };

  const handleManagerAlert = async (comment?: string) => {
    if (!managerAlertModal.problem) return;
    
    const manager = getManager(managerAlertModal.problem);
    if (!manager) return;

    try {
      // API call would go here
      // await createManagerAlert({ problemId: managerAlertModal.problem.id, managerId: manager.id, comment });
      
      success(`Отправлено менеджеру ${manager.name}`);
      setManagerAlertModal({ isOpen: false, problem: null });
    } catch (err) {
      error('Не удалось отправить уведомление менеджеру');
    }
  };

  const handleEmployeeAlert = async (message: string) => {
    if (!employeeAlertModal.problem || !currentUser) return;
    
    const employee = getEmployee(employeeAlertModal.problem);
    if (!employee) return;

    try {
      // Создаём EmployeeMessage
      const employeeMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: employee.id,
        fromUserId: currentUser.id,
        problemId: employeeAlertModal.problem.id,
        message: message,
        createdAt: new Date(),
        status: 'sent' as const
      };

      // API call would go here
      // await createEmployeeMessage(employeeMessage);
      // await notifyEmployee(employee.id, { type: 'message', problemId: employeeAlertModal.problem.id });
      
      // Показываем тост директору
      success(`Сообщение отправлено сотруднику ${employee.name}`);
      
      // Закрываем модалку
      setEmployeeAlertModal({ isOpen: false, problem: null });
    } catch (err) {
      error('Не удалось отправить сообщение сотруднику');
    }
  };

  const handleComment = async (commentText: string) => {
    if (!commentModal.problem) return;

    try {
      // API call would go here
      // await addComment({ problemId: commentModal.problem.id, comment: commentText, userId: currentUser?.id });
      
      success('Комментарий добавлен');
      setCommentModal({ isOpen: false, problem: null });
    } catch (err) {
      error('Не удалось добавить комментарий');
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!assignModal.problem) return;

    try {
      // API call would go here
      // await assignProblem({ problemId: assignModal.problem.id, assigneeId });
      
      const assignee = employees.find(e => e.id === assigneeId);
      success(`Проблема назначена ${assignee?.name || 'ответственному'}`);
      
      setProblemsData(prev => {
        const newMap = new Map(prev);
        const updated = { ...assignModal.problem!, assigneeId };
        newMap.set(assignModal.problem!.id, updated);
        return newMap;
      });
      
      setAssignModal({ isOpen: false, problem: null });
    } catch (err) {
      error('Не удалось назначить ответственного');
    }
  };

  const handleNavigateToLocation = (problem: Problem) => {
    if (problem.locationId) {
      router.push(`/dashboard/director/locations/${problem.locationId}`);
    }
  };

  const handleNavigateToEmployee = (problem: Problem) => {
    if (problem.employeeId) {
      router.push(`/dashboard/director/staff#${problem.employeeId}`);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <StatusIcon className={cn("h-5 w-5", config.color)} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{config.text}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Local Success Banner */}
          <AnimatePresence>
            {localSuccessBanner && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Проблема помечена как решённая</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">Все</TabsTrigger>
                <TabsTrigger value="finance" className="text-xs">Финансы</TabsTrigger>
                <TabsTrigger value="personnel" className="text-xs">Персонал</TabsTrigger>
                <TabsTrigger value="operations" className="text-xs">Операции</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Problems List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredProblems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет активных проблем
              </p>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredProblems.map(problem => {
                  const Icon = typeIcons[problem.category];
                  const manager = getManager(problem);
                  const employee = getEmployee(problem);
                  const isResolving = resolvedProblems.has(problem.id);

                  return (
                    <motion.div
                      key={problem.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={isResolving ? {
                        backgroundColor: "rgb(34 197 94 / 0.1)",
                        opacity: 1,
                        scale: 1
                      } : {
                        opacity: 1,
                        scale: 1,
                        backgroundColor: "transparent"
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0, 
                        marginBottom: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        transition: { duration: 0.3, ease: "easeInOut", delay: 0.25 }
                      }}
                      transition={{ 
                        backgroundColor: { duration: 0.25 },
                        layout: { duration: 0.2 }
                      }}
                      className={cn(
                        "group flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors relative overflow-hidden",
                        isResolving && "bg-emerald-50 dark:bg-emerald-950/20"
                      )}
                    >
                      {/* Pin icon */}
                      {problem.isPinned && (
                        <Pin className="h-3 w-3 text-amber-500 absolute top-2 right-10" />
                      )}

                      <AlertTriangle className={cn(
                        "h-4 w-4 flex-shrink-0 mt-0.5",
                        severityColors[problem.severity]
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-foreground group-hover:text-primary transition-colors flex-1">
                            {problem.title}
                          </p>
                        </div>
                        {problem.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {problem.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Icon className="h-3 w-3 mr-1" />
                            {typeLabels[problem.category]}
                          </Badge>
                          {problem.isPinned && (
                            <Badge variant="outline" className="text-xs text-amber-600">
                              <Pin className="h-3 w-3 mr-1" />
                              Закреплено
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          className="min-w-[220px]"
                        >
                          {problem.locationId && (
                            <DropdownMenuItem onClick={() => handleNavigateToLocation(problem)}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Перейти на страницу точки
                            </DropdownMenuItem>
                          )}
                          {problem.employeeId && (
                            <>
                              <DropdownMenuItem onClick={() => handleNavigateToEmployee(problem)}>
                                <User className="h-4 w-4 mr-2" />
                                Перейти на страницу сотрудника
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEmployeeAlertModal({ isOpen: true, problem })}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Связаться с сотрудником
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setManagerAlertModal({ isOpen: true, problem })}
                            disabled={!manager}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Сообщить менеджеру
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCommentModal({ isOpen: true, problem })}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Оставить комментарий
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssignModal({ isOpen: true, problem })}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Назначить ответственным
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePin(problem)}>
                            {problem.isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Открепить
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Закрепить
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleResolve(problem)}
                            className="text-emerald-600 dark:text-emerald-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Пометить как решённое
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </Card>

      {/* Modals */}
      <ManagerAlertModal
        isOpen={managerAlertModal.isOpen}
        onClose={() => setManagerAlertModal({ isOpen: false, problem: null })}
        problem={managerAlertModal.problem}
        manager={managerAlertModal.problem ? getManager(managerAlertModal.problem) : null}
        onSubmit={handleManagerAlert}
      />
      <EmployeeAlertModal
        isOpen={employeeAlertModal.isOpen}
        onClose={() => setEmployeeAlertModal({ isOpen: false, problem: null })}
        problem={employeeAlertModal.problem}
        employee={employeeAlertModal.problem ? getEmployee(employeeAlertModal.problem) : null}
        onSubmit={handleEmployeeAlert}
      />
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ isOpen: false, problem: null })}
        problem={commentModal.problem}
        onSubmit={handleComment}
      />
      <AssignModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, problem: null })}
        problem={assignModal.problem}
        employees={employees}
        onSubmit={handleAssign}
      />
    </>
  );
}
