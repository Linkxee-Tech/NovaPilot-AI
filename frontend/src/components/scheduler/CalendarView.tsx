import { useState, type ReactNode } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Linkedin, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { toast } from 'sonner';

interface CalendarViewProps {
    onDateSelect: (date: Date) => void;
}

interface CalendarPost {
    id: number;
    content: string;
    platform: string;
    status: string;
    scheduled_at?: string | null;
}

// Draggable Post Component
const DraggablePost = ({ post }: { post: CalendarPost }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: post.id.toString(),
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        position: 'relative' as const
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            <div className={cn(
                "border rounded p-1.5 flex items-start gap-2 group/post transition-all shadow-sm",
                post.status === 'scheduled'
                    ? "bg-indigo-500/10 border-indigo-500/30 dark:border-indigo-500/30 hover:border-indigo-500 text-indigo-700 dark:text-indigo-400"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-900 dark:text-slate-300"
            )}>
                <div className={cn(
                    "p-0.5 rounded shrink-0",
                    post.platform === 'linkedin' ? "bg-[#0077b5]" : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                )}>
                    {post.platform === 'linkedin' ? (
                        <Linkedin size={10} className="text-white" />
                    ) : (
                        <span className="text-slate-950 dark:text-white font-black text-[8px] px-0.5">X</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 truncate font-medium">{post.content}</p>
                    <div className="flex gap-1 mt-0.5">
                        <span className={cn(
                            "text-[8px] px-1 rounded font-bold uppercase tracking-tighter",
                            post.status === 'scheduled' ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}>
                            {post.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Droppable Day Component
interface DroppableDayProps {
    day: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    children: ReactNode;
    onClick: () => void;
}

const DroppableDay = ({ day, isCurrentMonth, isToday, children, onClick }: DroppableDayProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: format(day, 'yyyy-MM-dd'),
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "min-h-[140px] p-2 border-b border-r border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group relative",
                !isCurrentMonth && "bg-slate-50 dark:bg-slate-900/30 opacity-40",
                isToday && "bg-blue-600/5",
                isOver && "bg-blue-600/10 ring-2 ring-inset ring-blue-500/50"
            )}
        >
            <span className={cn(
                "text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-lg mb-2 transition-all",
                isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : isCurrentMonth ? "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" : "text-slate-300 dark:text-slate-700"
            )}>
                {format(day, 'd')}
            </span>
            <div className="space-y-1.5 relative z-10">
                {children}
            </div>
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-all">
                <Plus size={14} className="text-slate-400 dark:text-slate-600" />
            </div>
        </div>
    );
};

const CalendarView = ({ onDateSelect }: CalendarViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const queryClient = useQueryClient();

    const { data: posts = [], isLoading, isError } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const response = await client.get('/posts/posts');
            return response.data as CalendarPost[];
        }
    });

    const rescheduleMutation = useMutation({
        mutationFn: async ({ postId, newDate }: { postId: string, newDate: string }) => {
            const response = await client.post(`/posts/posts/${postId}/schedule`, {
                scheduled_at: newDate
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post rescheduled successfully');
        },
        onError: () => {
            toast.error('Failed to reschedule post');
        }
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            rescheduleMutation.mutate({
                postId: active.id.toString(),
                newDate: over.id.toString()
            });
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic animate-pulse">Syncing Tactical Grid...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                <AlertCircle className="text-red-500" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Communication Error</p>
                <button onClick={() => window.location.reload()} className="text-blue-500 text-xs font-black uppercase tracking-widest hover:underline">Retry Connection</button>
            </div>
        );
    }

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden h-full flex flex-col shadow-xl dark:shadow-2xl transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter min-w-[200px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Sync Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {days.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayPosts = posts.filter((p) => {
                            if (!p.scheduled_at) return false;
                            const postDate = format(parseISO(p.scheduled_at), 'yyyy-MM-dd');
                            return postDate === dateKey;
                        });

                        return (
                            <DroppableDay
                                key={day.toISOString()}
                                day={day}
                                isCurrentMonth={isSameMonth(day, monthStart)}
                                isToday={isSameDay(day, new Date())}
                                onClick={() => onDateSelect(day)}
                            >
                                {dayPosts.map((post) => (
                                    <DraggablePost key={post.id} post={post} />
                                ))}
                            </DroppableDay>
                        );
                    })}
                </div>
            </div>
        </DndContext>
    );
};

export default CalendarView;
