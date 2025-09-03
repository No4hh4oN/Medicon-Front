// src/components/common/PlainDialog.tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// 오버레이 (shadcn 스타일과 유사)
export const PlainDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]", // 배경
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
PlainDialogOverlay.displayName = "PlainDialogOverlay";

// 닫기 버튼 없는 Content
export const PlainDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <PlainDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4",
        "border border-neutral-800 bg-neutral-900 p-6 text-white shadow-lg outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2",
        "rounded-xl",
        className
      )}
      {...props}
    >
      {children}
      {/* ❌ 기본 Close 버튼을 아예 렌더링하지 않음 */}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
PlainDialogContent.displayName = "PlainDialogContent";

// Title/Description도 필요하면 함께 래핑해서 사용 가능
export const PlainDialogTitle = DialogPrimitive.Title;
export const PlainDialogDescription = DialogPrimitive.Description;
export const PlainDialog = DialogPrimitive.Root;
export const PlainDialogTrigger = DialogPrimitive.Trigger;
