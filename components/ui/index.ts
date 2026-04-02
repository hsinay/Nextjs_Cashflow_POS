/**
 * UI Components Index
 * 
 * Central export point for all reusable UI components using the design system.
 * All components follow design tokens defined in @/lib/design-tokens.ts
 */

// Design System Components
export { AlertBox, type AlertBoxProps } from './alert-box';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { Icon, useIconColor, useIconSize, type IconProps } from './icon';
export { KPICard, type KPICardProps } from './kpi-card';
export { StatusBadge, type StatusBadgeProps } from './status-badge';
export { Body, H1, H2, H3, Label, Small } from './typography';

// Enhanced Form Components
export { EnhancedButton, type EnhancedButtonProps } from './enhanced-button';
export { EnhancedInput, type EnhancedInputProps } from './enhanced-input';

// Existing shadcn/ui components (re-exported for centralized access)
export { Alert } from './alert';
export { Badge } from './badge';
export { Button } from './button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu';
export { Input } from './input';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';
export { Textarea } from './textarea';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

/**
 * Design System Component Categories:
 * 
 * Typography:
 *   - H1, H2, H3, Body, Small, Label
 *   Enforce exact font sizes, weights, and colors
 * 
 * Status & Indicators:
 *   - StatusBadge: Status indicators (PAID, PENDING, OVERDUE, etc.)
 *   - KPICard: Key performance indicator display with gradient accent
 *   - Icon: Semantic icon sizing and coloring
 *   - AlertBox: Inline notifications (success, warning, danger, info)
 * 
 * Empty States:
 *   - EmptyState: Centered empty state with icon, title, description, action
 * 
 * Form Controls:
 *   - EnhancedInput: Text input with label, error states, helper text
 *   - EnhancedButton: Button with multiple variants (primary, secondary, danger, etc.)
 *   - Input, Textarea, Select: Core form elements from shadcn/ui
 * 
 * Layout:
 *   - Card: Container component with optional header/footer
 *   - Table: Semantic table structure
 * 
 * Dialogs & Menus:
 *   - Dialog: Modal dialog
 *   - DropdownMenu: Dropdown menu for actions
 * 
 * Notifications:
 *   - Alert: Alert banner
 *   - Toast: Toast notifications via useToast hook
 * 
 * All components use Colors, Typography, Spacing, BorderRadius, Shadows from design tokens.
 */
