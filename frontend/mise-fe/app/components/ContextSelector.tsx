import { FormEvent, useState } from 'react';
import { Button } from './ui/Button';

interface ContextSelectorProps {
  contexts: string[];
  currentContext: string;
  onContextChange: (context: string) => void;
  onCustomContext: (context: string) => void;
}

export function ContextSelector({
  contexts,
  currentContext,
  onContextChange,
  onCustomContext,
}: ContextSelectorProps) {
  const [customValue, setCustomValue] = useState('');

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      onCustomContext(customValue.trim());
      setCustomValue('');
    }
  };

  return (
    <div className="flex gap-4 items-center p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Context:
        </label>
        <select
          value={currentContext}
          onChange={(e) => onContextChange(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {contexts.map((context) => (
            <option key={context} value={context}>
              {context.charAt(0).toUpperCase() + context.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Custom context..."
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button type="submit" size="sm" disabled={!customValue.trim()}>
          Add
        </Button>
      </form>
    </div>
  );
}
