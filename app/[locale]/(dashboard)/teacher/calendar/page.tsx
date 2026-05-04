"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(167,139,250,0.15)', borderTopColor: '#c4b5fd', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <p style={{ color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.3rem', opacity: 0.7 }}>
                        {t('label', { fallback: 'Teacher Tools' })}
                    </p>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#c4b5fd', margin: 0, lineHeight: 1 }}>
                        {t('title', { fallback: 'Calendario' })}
                    </h1>
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.05)' }}></div>
                    {DAYS.map(day => (
                        <div key={day.id} style={{ padding: '1rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {day.label}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
                    {HOURS.map(hour => (
                        <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <div style={{ padding: '1rem 0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                {hour}:00
                            </div>
                            {DAYS.map(day => {
                                const slotEvent = events.find(e => e.day_of_week === day.id && e.hour === hour);
                                return (
                                    <div
                                        key={`${day.id}-${hour}`}
                                        onClick={() => handleSlotClick(day.id, hour)}
                                        style={{
                                            borderRight: '1px solid rgba(255,255,255,0.02)',
                                            minHeight: '60px',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            background: 'transparent'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {slotEvent && (
                                            <div style={{
                                                background: 'rgba(167,139,250,0.15)',
                                                border: '1px solid rgba(167,139,250,0.3)',
                                                borderRadius: '6px',
                                                padding: '0.4rem',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {slotEvent.student_name}
                                                </span>
                                                <button
                                                    onClick={(e) => handleRemoveEvent(e, slotEvent.id)}
                                                    style={{ background: 'none', border: 'none', color: 'rgba(231,76,60,0.7)', cursor: 'pointer', padding: 0, alignSelf: 'flex-end' }}
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
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: '#c4b5fd', margin: 0, letterSpacing: '0.04em' }}>
                                {t('modal.title', { fallback: 'Asignar Alumno' })}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {students.length === 0 ? (
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No tienes alumnos activos.</p>
                            ) : (
                                students.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleAssignStudent(student)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                                            cursor: 'pointer', color: 'var(--text)', textAlign: 'left',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    >
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {student.username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{student.username}</span>
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