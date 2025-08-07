import * as React from "react"
import { toast as sonnerToast } from "@/components/ui/sonner"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ title, description, action, ...rest }: Toast) {
  // Bridge shadcn's toast API to Sonner
  const anyProps: any = rest as any;
  const variant: string | undefined = (anyProps && anyProps.variant) || undefined;

  // Choose a reasonable message/title
  let message = "";
  if (typeof title === "string" && title.trim().length) message = title;
  else if (typeof description === "string" && description.trim().length) message = description;
  else message = "Notification";

  const options: any = {};
  if (typeof description === "string") options.description = description;
  if (anyProps && typeof anyProps.duration === "number") options.duration = anyProps.duration;
  // Note: shadcn's `action` element doesn't directly map to Sonner; ignore gracefully.

  let id: string | number;
  if (variant === "destructive" || variant === "error") {
    id = sonnerToast.error(message, options);
  } else if (variant === "success") {
    id = sonnerToast.success(message, options);
  } else if (variant === "info") {
    id = sonnerToast.info ? sonnerToast.info(message, options) : sonnerToast(message, options);
  } else if (variant === "warning") {
    id = (sonnerToast as any).warning ? (sonnerToast as any).warning(message, options) : sonnerToast(message, options);
  } else {
    id = sonnerToast(message, options);
  }

  const dismiss = () => sonnerToast.dismiss(id as any);
  const update = (_props: ToasterToast) => {
    const newTitle = typeof _props.title === "string" ? _props.title : message;
    const newDesc = typeof _props.description === "string" ? _props.description : options.description;
    const v: any = ( _props as any ).variant ?? variant;
    if (v === "destructive" || v === "error") {
      id = sonnerToast.error(newTitle, { description: newDesc });
    } else if (v === "success") {
      id = sonnerToast.success(newTitle, { description: newDesc });
    } else {
      id = sonnerToast(newTitle, { description: newDesc });
    }
  };

  return {
    id: String(id ?? genId()),
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) sonnerToast.dismiss(toastId as any)
      else sonnerToast.dismiss()
    },
  }
}

export { useToast, toast }
