'use client';

import * as React from 'react';

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  variant?: 'default' | 'destructive' | 'success';
};

const TOAST_LIMIT = 1;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(toasts: Toast[]) => void> = [];
let count = 0;
let toasts: Toast[] = [];

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

function dispatch(toasts: Toast[]) {
  listeners.forEach((listener) => {
    listener(toasts);
  });
}

export const toast = ({
  title,
  description,
  action,
  variant = 'default',
  ...props
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
} & Record<string, any>) => {
  const id = genId();

  const update = (newToast: Partial<Toast>) =>
    toast({ title, description, action, variant, ...newToast } as any);
  
  const dismiss = () => {
    toasts = toasts.filter((t) => t.id !== id);
    dispatch(toasts);
  };

  toasts = [
    {
      id,
      title,
      description,
      action,
      open: true,
      variant,
      ...props,
    },
    ...toasts,
  ].slice(0, TOAST_LIMIT);

  dispatch(toasts);

  // Auto dismiss after 3 seconds
  if (toastTimeouts.has(id)) clearTimeout(toastTimeouts.get(id));
  const timeout = setTimeout(dismiss, 3000);
  toastTimeouts.set(id, timeout);

  return { id, dismiss, update };
};

export function useToast() {
  const [_toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts: _toasts,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        toasts = toasts.filter((t) => t.id !== toastId);
      } else {
        toasts = [];
      }
      dispatch(toasts);
    },
  };
}
