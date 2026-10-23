"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { PageSpinner } from '@/components/ui/Spinner';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

// Representa una fila de la tabla "teacher_students"
interface TeacherStudent {
    id: string; // Este es el teacher_student_id
    auth_user_id: string | null; // (Opcional) El ID real del usuario si ya aceptó
    username: string;
    avatar_url: string | null;
}

// Representa una fila de la tabla "teacher_schedule"
interface CalendarEvent {
    id: string;
    teacher_student_id: string; 
    student_name: string;
    day_of_week: number;
    hour: number;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const DAYS = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
];

export default function TeacherCalendarPage() {
    const t = useTranslations('TeacherCalendar');
    const router = useRouter();
    const locale = useLocale();

    const [students, setStudents] = useState<TeacherStudent[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Cargar alumnos (relaciones)
        const { data: ts } = await supabase
            .from('teacher_students')
            .select(`id, student_id, invite_email, status, profiles:student_id(username, avatar_url)`)
            .eq('teacher_id', user.id)
            .eq('status', 'active');

        if (ts) {
            setStudents(ts.map(s => {
                const profile = s.profiles as any;
                return {
                    id: s.id, // ID de la relación (teacher_student_id)
                    auth_user_id: s.student_id, 
                    username: profile?.username || s.invite_email.split('@')[0],
                    avatar_url: profile?.avatar_url || null
                };
            }));
        }

        // 2. Cargar eventos del calendario
        const { data: evs, error } = await supabase
            .from('teacher_schedule')
            .select(`
                id,
                day_of_week,
                hour,
                teacher_student_id,
                teacher_students (
                    invite_email,
                    profiles ( username )
                )
            `)
            .eq('teacher_id', user.id);

        if (evs) {
            setEvents(evs.map(e => {
                const tsData = Array.isArray(e.teacher_students) ? e.teacher_students[0] : e.teacher_students;
                const profile = Array.isArray(tsData?.profiles) ? tsData?.profiles[0] : tsData?.profiles;
                const displayName = profile?.username || tsData?.invite_email?.split('@')[0] || 'Alumno';

                return {
                    id: e.id,
                    teacher_student_id: e.teacher_student_id,
                    student_name: displayName,
                    day_of_week: e.day_of_week,
                    hour: e.hour
                };
            }));
        }

        setLoading(false);
    };

    const handleSlotClick = (day: number, hour: number) => {
        setSelectedSlot({ day, hour });
        setIsModalOpen(true);
    };

    const handleAssignStudent = async (student: TeacherStudent) => {
        if (!selectedSlot) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newEventId = crypto.randomUUID();

        const dbPayload = {
            id: newEventId,
            teacher_id: user.id,
            teacher_student_id: student.id, 
            day_of_week: selectedSlot.day,
            hour: selectedSlot.hour
        };

        const { error } = await supabase
            .from('teacher_schedule')
            .insert(dbPayload);

        if (!error) {
            const uiEvent: CalendarEvent = {
                id: newEventId,
                teacher_student_id: student.id,
                student_name: student.username,
                day_of_week: selectedSlot.day,
                hour: selectedSlot.hour
            };

            setEvents([
                ...events.filter(e => !(e.day_of_week === selectedSlot.day && e.hour === selectedSlot.hour)), 
                uiEvent
            ]);
        } else {
            console.error("Error asignando alumno:", error);
        }

        setIsModalOpen(false);
        setSelectedSlot(null);
    };

    const handleRemoveEvent = async (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        await supabase.from('teacher_schedule').delete().eq('id', eventId);
        setEvents(events.filter(ev => ev.id !== eventId));
    };

    if (loading) return (
        <PageSpinner color="#c4b5fd" trackColor="rgba(167,139,250,0.15)" />
    );

    return (
        <div className={styles.labelStack}>

            <div className={styles.labelRow}>
                <div>
                    <p className={ui.teacherEyebrow}>
                        {t('label', { fallback: 'Teacher Tools' })}
                    </p>
                    <h1 className={ui.teacherTitle}>
                        {t('title', { fallback: 'Calendario' })}
                    </h1>
                </div>
            </div>

            <div className={styles.stack}>
                <div className={styles.grid}>
                    <div className={styles.block}></div>
                    {DAYS.map(day => (
                        <div key={day.id} className={styles.labelStackBlock}>
                            {day.label}
                        </div>
                    ))}
                </div>

                <div className={styles.hourStack}>
                    {HOURS.map(hour => (
                        <div key={hour} className={styles.hourGrid}>
                            <div className={styles.row}>
                                {hour}:00
                            </div>
                            {DAYS.map(day => {
                                const slotEvent = events.find(e => e.day_of_week === day.id && e.hour === hour);
                                return (
                                    <div
                                        key={`${day.id}-${hour}`}
                                        onClick={() => handleSlotClick(day.id, hour)}
                                        className={styles.box}
                                    >
                                        {slotEvent && (
                                            <div className={styles.studentNameStack}>
                                                <span className={styles.label}>
                                                    {slotEvent.student_name}
                                                </span>
                                                <button
                                                    onClick={(e) => handleRemoveEvent(e, slotEvent.id)}
                                                    className={styles.button}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className={ui.overlay}>
                    <div className={styles.titleBox}>
                        <div className={styles.titleRow}>
                            <h3 className={styles.titleSubheading}>
                                {t('modal.title', { fallback: 'Asignar Alumno' })}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className={styles.titleRowButton}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className={styles.titleBoxStack}>
                            {students.length === 0 ? (
                                <p className={styles.text}>No tienes alumnos activos.</p>
                            ) : (
                                students.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleAssignStudent(student)}
                                        className={styles.titleBoxButton}
                                    >
                                        <div className={styles.titleBoxRow}>
                                            {student.username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className={styles.usernameLabel}>{student.username}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}