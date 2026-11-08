/**
 * ErrorMessage — displays an error string to the user.
 * Placeholder — UI implementation pending.
 */
interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return <div role="alert">{message}</div>;
}
