import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { getAvailableDates } from "../utils/newsCache";

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const availableDates = getAvailableDates();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const today = new Date();

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 border-border"
            data-ocid="calendar.open_modal_button"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {selectedDate ? formatDate(selectedDate) : "Today"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="end"
          data-ocid="calendar.popover"
        >
          <Calendar
            mode="single"
            selected={selectedDate ?? today}
            onSelect={(date) => {
              if (date) {
                onDateSelect(date);
                setOpen(false);
              }
            }}
            disabled={(date) => date < cutoffDate || date > today}
            modifiers={{ available: availableDates }}
            modifiersClassNames={{ available: "bg-primary/20 font-semibold" }}
            initialFocus
          />
          {selectedDate && (
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1"
                data-ocid="calendar.close_button"
                onClick={() => {
                  onDateSelect(null);
                  setOpen(false);
                }}
              >
                <X className="w-3 h-3" />
                Show Today's Live News
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
