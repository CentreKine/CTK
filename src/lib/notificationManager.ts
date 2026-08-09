// Activity Notification System
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  duration: number; // in milliseconds
  read: boolean;
}

export class NotificationManager {
  private static notifications: Notification[] = [];
  private static listeners: ((notifications: Notification[]) => void)[] = [];
  private static timeouts: Map<string, NodeJS.Timeout> = new Map();

  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static notify(
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      duration,
      read: false
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // Auto-remove after duration
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.remove(id);
      }, duration);
      this.timeouts.set(id, timeout);
    }

    return id;
  }

  static success(title: string, message: string, duration?: number): string {
    return this.notify('success', title, message, duration);
  }

  static error(title: string, message: string, duration?: number): string {
    return this.notify('error', title, message, duration ?? 7000);
  }

  static warning(title: string, message: string, duration?: number): string {
    return this.notify('warning', title, message, duration ?? 6000);
  }

  static info(title: string, message: string, duration?: number): string {
    return this.notify('info', title, message, duration);
  }

  static remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    this.notifyListeners();
  }

  static clear(): void {
    this.notifications = [];
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.notifyListeners();
  }

  static getAll(): Notification[] {
    return [...this.notifications];
  }

  static markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

// Activity Logger for backend storage
export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'LOGIN' | 'LOGOUT' | 'DOWNLOAD';
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogger {
  static log(
    action: ActivityEntry['action'],
    entityType: string,
    entityId: string,
    userId: string,
    userName: string,
    details: string
  ): ActivityEntry {
    const entry: ActivityEntry = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      userId,
      userName,
      details,
      userAgent: navigator.userAgent
    };

    // Store in localStorage for persistence
    const activities = JSON.parse(localStorage.getItem('ctk_activities') || '[]');
    activities.push(entry);
    
    // Keep only last 1000 entries
    if (activities.length > 1000) {
      activities.shift();
    }
    
    localStorage.setItem('ctk_activities', JSON.stringify(activities));

    return entry;
  }

  static getActivities(limit: number = 100): ActivityEntry[] {
    const activities = JSON.parse(localStorage.getItem('ctk_activities') || '[]');
    return activities.slice(-limit).reverse();
  }

  static getActivitiesByType(entityType: string, limit: number = 100): ActivityEntry[] {
    const activities = JSON.parse(localStorage.getItem('ctk_activities') || '[]');
    return activities
      .filter((a: ActivityEntry) => a.entityType === entityType)
      .slice(-limit)
      .reverse();
  }

  static clearActivities(): void {
    localStorage.removeItem('ctk_activities');
  }
}
