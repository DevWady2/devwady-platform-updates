import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameDay, isSameMonth, eachDayOfInterval
} from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface BookingCalendarProps {
  currentMonth: Date;
  setCurrentMonth: (fn: (m: Date) => Date) => void;
  selectedDate: Date | null;
  onSelectDate: (day: Date) => void;
  dayHasSlots: (day: Date) => boolean;
  canGoPrevMonth: boolean;
}

export default function BookingCalendar({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  onSelectDate,
  dayHasSlots,
  canGoPrevMonth,
}: BookingCalendarProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const weekDayHeaders = useMemo(() =>
    isAr
      ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    [isAr]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const year = format(currentMonth, "yyyy");
  const month = format(currentMonth, "MMMM", { locale: isAr ? ar : enUS }).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Month nav header */}
      <div className="flex items-center justify-center gap-3 py-4 px-6">
        <span className="text-base font-bold tracking-wide">
          {year}
        </span>
        <span className="text-base font-bold tracking-wide text-foreground">
          {month}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            disabled={!canGoPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-4">
        {weekDayHeaders.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-4 pb-5">
        {calendarDays.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const hasSlots = dayHasSlots(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          // Unavailable days with slots = booked/unavailable → show red-ish
          // Available days → normal
          // No availability at all → muted

          return (
            <button
              key={i}
              disabled={!inMonth || !hasSlots}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-center py-3 text-sm font-semibold transition-all
                ${isSelected
                  ? "bg-secondary text-secondary-foreground rounded-lg shadow-md"
                  : !inMonth
                    ? "text-transparent pointer-events-none"
                    : hasSlots
                      ? "text-foreground hover:bg-accent/50 rounded-lg cursor-pointer"
                      : "text-destructive/60 cursor-not-allowed"
                }
                ${isToday && !isSelected ? "ring-2 ring-primary/30 rounded-lg" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {inMonth && hasSlots && !isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
              {inMonth && !hasSlots && (
                <span className="text-[9px] font-normal text-destructive/50">--</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
