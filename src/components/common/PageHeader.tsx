/**
 * PageHeader — common page title/subtitle wrapper.
 * Placeholder — UI implementation pending.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
