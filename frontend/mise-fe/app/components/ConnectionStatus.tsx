import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { ConnectionStatus } from '@mise-fe/types';
import { Badge } from './ui/Badge';

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'success' as const,
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          variant: 'warning' as const,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          variant: 'error' as const,
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error',
          variant: 'error' as const,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config?.icon ?? Loader2;

  return (
    <Badge
      variant={config?.variant ?? 'warning'}
      className="flex items-center gap-1"
    >
      <Icon
        className={`w-3 h-3 ${status === 'connecting' ? 'animate-spin' : ''}`}
      />
      {config?.text ?? 'Unknown Status'}
    </Badge>
  );
}
