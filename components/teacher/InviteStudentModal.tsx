"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { fetchSubscriptionTier, getMaxStudents } from '@/lib/subscription';
import styles from './InviteStudentModal.module.css';
import ui from '@/components/ui/ui.module.css';

type InviteError = 'cannotInviteSelf' | 'limitReached' | 'alreadyInvited' | 'error';

async function inviteStudent(rawEmail: string): Promise<InviteError | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'error';
    const email = rawEmail.trim().toLowerCase();

    if (user.email && email === user.email.toLowerCase()) return 'cannotInviteSelf';

    const [{ count }, tier] = await Promise.all([
        supabase
            .from('teacher_students')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', user.id)
            .in('status', ['active', 'pending']),
        fetchSubscriptionTier(user.id),
    ]);
    if ((count ?? 0) >= getMaxStudents(tier)) return 'limitReached';

    const { data: existing } = await supabase
        .from('teacher_students')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('invite_email', email)
        .maybeSingle();
    if (existing) return 'alreadyInvited';

    // Inserted as pending — student_id is resolved when the student accepts
    const { error } = await supabase
        .from('teacher_students')
        .insert({
            teacher_id: user.id,
            student_id: null,
            invite_email: email,
            invite_token: crypto.randomUUID(),
            status: 'pending',
        });

    return error ? 'error' : null;
}

export function InviteStudentModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
    const t = useTranslations('TeacherDashboard');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInvite = async () => {
        if (!email.trim()) return;
        setLoading(true); setError('');
        try {
            const inviteError = await inviteStudent(email);
            if (inviteError) { setError(t(`invite.${inviteError}`)); return; }
            onInvited();
            onClose();
        } catch {
            setError(t('invite.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={ui.overlay}>
            <div className={styles.titleBox}>
                <div className={styles.titleRow}>
                    <div>
                        <h3 className={styles.titleSubheading}>
                            {t('invite.title')}
                        </h3>
                        <p className={styles.subtitleText}>{t('invite.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className={styles.button}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.emailPlaceholderStack}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInvite()}
                        placeholder={t('invite.emailPlaceholder')}
                        className={styles.emailPlaceholderInput}
                        autoFocus
                    />
                    {error && <p className={styles.text}>{error}</p>}
                    <button
                        onClick={handleInvite}
                        disabled={loading || !email.trim()}
                        className={styles.sendingButton} style={{ background: loading ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.2)', cursor: loading ? 'not-allowed' : 'pointer', opacity: !email.trim() ? 0.5 : 1 }}
                    >
                        {loading ? t('invite.sending') : t('invite.send')}
                    </button>
                </div>
            </div>
        </div>
    );
}
