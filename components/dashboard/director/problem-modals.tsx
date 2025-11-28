"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Problem } from "@/lib/problem-types";
import { User } from "@/lib/store";
import { Loader2 } from "lucide-react";

interface ManagerAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  manager: User | null;
  onSubmit: (comment?: string) => Promise<void>;
}

export function ManagerAlertModal({ 
  isOpen, 
  onClose, 
  problem, 
  manager,
  onSubmit 
}: ManagerAlertModalProps) {
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!problem || !manager) return;
    
    setIsLoading(true);
    try {
      await onSubmit(comment || undefined);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Failed to send alert:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!problem || !manager) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Сообщить менеджеру"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Проблема
          </Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">{problem.title}</p>
            {problem.description && (
              <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="comment" className="text-sm font-medium">
            Комментарий (необязательно)
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Добавьте дополнительную информацию для менеджера..."
            className="mt-2 min-h-[100px]"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface EmployeeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  employee: User | null;
  onSubmit: (message: string) => Promise<void>;
}

export function EmployeeAlertModal({ 
  isOpen, 
  onClose, 
  problem, 
  employee,
  onSubmit 
}: EmployeeAlertModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when modal opens and reset message when closed
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    } else if (!isOpen) {
      // Reset message when modal closes
      setMessage("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!problem || !employee || !message.trim()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(message.trim());
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!problem || !employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Сообщение сотруднику: ${employee.name}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Контекст проблемы */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Проблема
          </Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">{problem.title}</p>
            {problem.description && (
              <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
            )}
          </div>
        </div>

        {/* Поле ввода сообщения (обязательно) */}
        <div>
          <Label htmlFor="message" className="text-sm font-medium">
            Сообщение
          </Label>
          <Textarea
            id="message"
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="mt-2 min-h-[100px]"
            disabled={isLoading}
            rows={4}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              "Отправить"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  onSubmit: (comment: string) => Promise<void>;
}

export function CommentModal({ 
  isOpen, 
  onClose, 
  problem, 
  onSubmit 
}: CommentModalProps) {
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!problem || !comment.trim()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(comment);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!problem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Оставить комментарий"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Проблема
          </Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">{problem.title}</p>
            {problem.description && (
              <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="comment" className="text-sm font-medium">
            Комментарий
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Введите ваш комментарий..."
            className="mt-2 min-h-[100px]"
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !comment.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  employees: User[];
  onSubmit: (assigneeId: string) => Promise<void>;
}

export function AssignModal({ 
  isOpen, 
  onClose, 
  problem, 
  employees,
  onSubmit 
}: AssignModalProps) {
  const [assigneeId, setAssigneeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!problem || !assigneeId) return;
    
    setIsLoading(true);
    try {
      await onSubmit(assigneeId);
      setAssigneeId("");
      onClose();
    } catch (error) {
      console.error("Failed to assign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!problem) return null;

  // Фильтруем только менеджеров и активных сотрудников
  const assignableUsers = employees.filter(
    e => (e.role === 'manager' || e.role === 'employee') && e.status === 'active'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Назначить ответственным"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Проблема
          </Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground">{problem.title}</p>
            {problem.description && (
              <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="assignee" className="text-sm font-medium">
            Ответственный
          </Label>
          <select
            id="assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          >
            <option value="">Выберите ответственного...</option>
            {assignableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === 'manager' ? 'Менеджер' : 'Сотрудник'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !assigneeId}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Назначение...
              </>
            ) : (
              "Назначить"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

