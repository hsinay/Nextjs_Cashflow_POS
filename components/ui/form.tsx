import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { Controller, FieldPath, FieldValues, FormProvider, useFormContext, UseFormReturn } from "react-hook-form";

type FormProps<TFieldValues extends FieldValues> = {
  children: React.ReactNode;
  form: UseFormReturn<TFieldValues>;
};

function Form<TFieldValues extends FieldValues>({ children, form }: FormProps<TFieldValues>) {
  return <FormProvider {...form}>{children}</FormProvider>;
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = Omit<
  React.ComponentPropsWithoutRef<typeof Controller<TFieldValues>>,
  'render'
> & {
  name: TName;
  render: ControllerProps<TFieldValues, TName>["render"];
};

const FormField = React.forwardRef(function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: FormFieldProps<TFieldValues, TName>,
  _ref: React.ForwardedRef<React.ElementRef<typeof Controller<TFieldValues>>>
) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}) as <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: FormFieldProps<TFieldValues, TName> & { ref?: React.ForwardedRef<React.ElementRef<typeof Controller<TFieldValues>>> }
) => React.ReactElement;
FormField.displayName = "FormField";

function useFormField<TFieldValues extends FieldValues = FieldValues>() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const context = useFormContext<TFieldValues>() as any

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  // Safely access formState, provide defaults if not available
  const formState = context?.formState || {
    errors: {},
    dirtyFields: {},
    touchedFields: {},
  }

  // Manually compute field state from formState with safe access
  const fieldState = {
    invalid: !!(formState?.errors?.[fieldContext.name]),
    isDirty: !!(formState?.dirtyFields?.[fieldContext.name]),
    isTouched: !!(formState?.touchedFields?.[fieldContext.name]),
    error: formState?.errors?.[fieldContext.name] || null,
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={`space-y-2 ${className}`} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<"label">,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
        error ? "text-red-500" : ""
      } ${className}`}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-500 ${className}`}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : null

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={`text-sm font-medium text-red-500 ${className}`}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  Form, FormControl,
  FormDescription, FormField, FormItem,
  FormLabel, FormMessage, useFormField
};

