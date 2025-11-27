import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeatPulseEvent {
  type: 'opened' | 'interacting' | 'upsell' | 'dropoff' | 'completed';
  timestamp: number;
  id: string;
}

interface CheckoutHeatPulseProps {
  events: HeatPulseEvent[];
}

export const CheckoutHeatPulse = ({ events: initialEvents }: CheckoutHeatPulseProps) => {
  const [events, setEvents] = useState(initialEvents);
  const [activePulse, setActivePulse] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new events
      const eventTypes: HeatPulseEvent['type'][] = ['opened', 'interacting', 'upsell', 'completed'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const newEvent: HeatPulseEvent = {
        type: randomType,
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random()}`,
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      setActivePulse(newEvent.id);
      setTimeout(() => setActivePulse(null), 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getEventColor = (type: HeatPulseEvent['type']) => {
    switch (type) {
      case 'opened':
        return 'bg-[hsl(var(--success))]';
      case 'interacting':
        return 'bg-[hsl(var(--neon-blue))]';
      case 'upsell':
        return 'bg-[hsl(var(--warning))]';
      case 'dropoff':
        return 'bg-[hsl(var(--danger))]';
      case 'completed':
        return 'bg-white';
      default:
        return 'bg-muted';
    }
  };

  const getEventLabel = (type: HeatPulseEvent['type']) => {
    const labels = {
      opened: 'Opened',
      interacting: 'Active',
      upsell: 'Upsell',
      dropoff: 'Drop-off',
      completed: 'Completed',
    };
    return labels[type];
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Checkout Heat Pulse</h3>
          <div className="text-xs text-muted-foreground">Real-time activity</div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {['opened', 'interacting', 'upsell', 'dropoff', 'completed'].map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", getEventColor(type as HeatPulseEvent['type']))} />
              <span className="text-muted-foreground capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Circular radar visualization */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Concentric circles */}
            {[1, 2, 3, 4].map((circle) => (
              <div
                key={circle}
                className="absolute rounded-full border border-border/30"
                style={{
                  width: `${circle * 25}%`,
                  height: `${circle * 25}%`,
                }}
              />
            ))}
          </div>

          {/* Event pulses */}
          {events.slice(0, 12).map((event, idx) => {
            const angle = (idx / 12) * 2 * Math.PI;
            const radius = 35 + (idx % 3) * 15;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <div
                key={event.id}
                className="absolute transition-all duration-500"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className={cn(
                    "h-3 w-3 rounded-full transition-all duration-300",
                    getEventColor(event.type),
                    activePulse === event.id && "scale-150"
                  )}
                  style={{
                    boxShadow: activePulse === event.id ? `0 0 20px ${event.type === 'completed' ? 'white' : 'currentColor'}` : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Recent activity list */}
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-sm font-medium">Recent Activity</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs">
                <div className={cn("h-1.5 w-1.5 rounded-full", getEventColor(event.type))} />
                <span className="text-muted-foreground">
                  {getEventLabel(event.type)} • {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
