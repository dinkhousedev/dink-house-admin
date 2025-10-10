import { addToast } from "@heroui/toast";

/**
 * Athletic-themed notification system for Dink House
 * Uses HeroUI Toast with Dink House branding (Lime #B3FF00, Dark theme)
 */

interface ToastOptions {
  title?: string;
  description: string;
  duration?: number;
}

export const showToast = {
  success: ({ title = "Success", description }: ToastOptions) => {
    addToast({
      title,
      description,
      variant: "solid",
      classNames: {
        base: "bg-dink-lime/20 border border-dink-lime text-dink-white",
        title: "text-dink-lime font-semibold",
        description: "text-dink-white",
      },
    });
  },

  error: ({ title = "Error", description }: ToastOptions) => {
    addToast({
      title,
      description,
      variant: "solid",
      classNames: {
        base: "bg-danger/20 border border-danger text-white",
        title: "text-danger font-semibold",
        description: "text-white",
      },
    });
  },

  warning: ({ title = "Warning", description }: ToastOptions) => {
    addToast({
      title,
      description,
      variant: "solid",
      classNames: {
        base: "bg-warning/20 border border-warning text-white",
        title: "text-warning font-semibold",
        description: "text-white",
      },
    });
  },

  info: ({ title = "Info", description }: ToastOptions) => {
    addToast({
      title,
      description,
      variant: "solid",
      classNames: {
        base: "bg-primary/20 border border-primary text-white",
        title: "text-primary font-semibold",
        description: "text-white",
      },
    });
  },
};

// Convenience methods for common use cases
export const notify = {
  success: (message: string) => showToast.success({ description: message }),
  error: (message: string) => showToast.error({ description: message }),
  warning: (message: string) => showToast.warning({ description: message }),
  info: (message: string) => showToast.info({ description: message }),
};
