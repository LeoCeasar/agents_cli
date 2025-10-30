import { select, text, confirm, multiselect } from '@clack/prompts';

export async function selectOption(message: string, options: Array<{
  value: string;
  label: string;
  description?: string;
}>): Promise<string> {
  const result = await select({
    message,
    options: options.map(opt => ({
      value: opt.value,
      label: opt.label,
      hint: opt.description
    }))
  });
  return result as string;
}

export async function multiSelect(message: string, options: Array<{
  value: string;
  label: string;
  description?: string;
}>): Promise<string[]> {
  const result = await multiselect({
    message,
    options: options.map(opt => ({
      value: opt.value,
      label: opt.label,
      hint: opt.description
    }))
  });
  return result as string[];
}

export async function textInput(
  message: string,
  placeholder?: string,
  validate?: (value: string) => string | undefined
): Promise<string> {
  const result = await text({
    message,
    placeholder,
    validate
  });
  return result as string;
}

export async function confirmAction(message: string): Promise<boolean> {
  const result = await confirm({
    message
  });
  return result as boolean;
}

export async function passwordInput(message: string): Promise<string> {
  const { password } = await import('@clack/prompts');
  const result = await password({
    message
  });
  return result as string;
}