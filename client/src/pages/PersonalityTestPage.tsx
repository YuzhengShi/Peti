import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { useTestProgress } from '../hooks/useTestProgress';
import { useOnboarding } from '../hooks/useOnboarding';
import { domainSections } from '../questions';

export function PersonalityTestPage() {
  const navigate = useNavigate();
  const { setTestCompleted } = useOnboarding();
  const {
    currentSection,
    currentDomainIndex,
    totalDomains,
    answers,
    answersByDomain,
    completedDomains,
    allComplete,
    loading,
    setAnswer,
    submitDomain,
    triggerOnboarding,
    jumpToDomain,
  } = useTestProgress();

  const [submitting, setSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Refs for section jump navigation
  const skipNextIntro = useRef(false);
  const isReviewing = useRef(false);
  const savedQuestionIndex = useRef(0);

  // Cleanup fade timer on unmount
  useEffect(() => () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); }, []);

  function fadeToQuestion(newIndex: number) {
    if (fading) return;
    setFading(true);
    fadeTimer.current = setTimeout(() => {
      setQuestionIndex(newIndex);
      setFading(false);
    }, 200);
  }

  // Home domain = first incomplete domain (actual progress)
  const homeDomainIndex = domainSections.findIndex(s => !completedDomains.has(s.id));
  const effectiveHomeIndex = homeDomainIndex === -1 ? domainSections.length : homeDomainIndex;

  // When domain changes, decide whether to show intro or restore position
  useEffect(() => {
    if (skipNextIntro.current) {
      skipNextIntro.current = false;
      return;
    }
    if (isReviewing.current) {
      // Returning from review after submit — restore home position
      isReviewing.current = false;
      setShowIntro(false);
      setQuestionIndex(savedQuestionIndex.current);
    } else {
      // Normal progression — show intro
      setShowIntro(true);
      setQuestionIndex(0);
    }
  }, [currentDomainIndex]);

  // If all complete, navigate to results
  useEffect(() => {
    if (!loading && allComplete) {
      navigate('/results', { replace: true });
    }
  }, [loading, allComplete, navigate]);

  function handleSectionClick(i: number) {
    const isCurrent = i === currentDomainIndex;
    if (isCurrent) return;

    const isCompleted = completedDomains.has(domainSections[i].id);
    const isHome = i === effectiveHomeIndex;

    if (!isCompleted && !isHome) return; // future incomplete sections not clickable

    // Save home question index when leaving home
    if (currentDomainIndex === effectiveHomeIndex) {
      savedQuestionIndex.current = questionIndex;
    }

    skipNextIntro.current = true;

    if (isHome) {
      // Returning to home — restore position, no intro
      isReviewing.current = false;
      jumpToDomain(i);
      setShowIntro(false);
      setQuestionIndex(savedQuestionIndex.current);
    } else {
      // Jumping to completed section — show questions from start
      isReviewing.current = true;
      jumpToDomain(i);
      setShowIntro(false);
      setQuestionIndex(0);
    }
  }

  function handleAnswer(itemId: string, value: number) {
    const wasUnanswered = answers[itemId] === undefined;
    setAnswer(itemId, value);
    // Auto-advance only on first answer, not when changing, not on last question,
    // and not when reviewing a completed section (all Qs start unanswered there)
    const reviewing = currentSection && completedDomains.has(currentSection.id);
    if (!reviewing && wasUnanswered && currentSection && questionIndex < currentSection.items.length - 1) {
      setTimeout(() => {
        fadeToQuestion(questionIndex + 1);
      }, 300);
    }
  }

  async function handleSubmitDomain() {
    setSubmitting(true);
    try {
      await submitDomain();
      if (currentDomainIndex >= totalDomains - 1) {
        await triggerOnboarding();
        setTestCompleted();
        navigate('/results', { replace: true });
      }
    } catch {
      // Error state would be handled by toast in production
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DraggableWindow title="Personality Test" defaultWidth={920} defaultHeight={700}>
        <div className="spinner">preparing your questions...</div>
      </DraggableWindow>
    );
  }

  if (!currentSection) {
    return (
      <DraggableWindow title="Personality Test" defaultWidth={920} defaultHeight={700}>
        <div className="spinner">wrapping up...</div>
      </DraggableWindow>
    );
  }

  const { items, scale, title, intro, timeframe } = currentSection;
  const answeredCount = items.filter(item => answers[item.id] !== undefined).length;
  const allAnswered = answeredCount === items.length;
  const currentItem = items[questionIndex];
  const isLastQuestion = questionIndex === items.length - 1;

  return (
    <DraggableWindow
      key={showIntro ? `intro-${currentDomainIndex}` : `questions-${currentDomainIndex}`}
      title={showIntro ? 'Personality Test' : 'Peti wants to know about you'}
      defaultWidth={showIntro ? 640 : 820}
      defaultHeight={showIntro ? 460 : currentDomainIndex === 3 ? 780 : 670}
    >
      <div ref={topRef} style={{ padding: '2rem' }}>
        {/* Segmented section progress bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: 4, height: 10 }}>
            {domainSections.map((section, i) => {
              const isCompleted = completedDomains.has(section.id);
              const isCurrent = i === currentDomainIndex;
              const isHome = i === effectiveHomeIndex;
              const isClickable = !isCurrent && (isCompleted || isHome);

              // Completed sections always show full; others use actual answer count
              const domainAnswers = answersByDomain[section.id] || {};
              const sectionAnswered = isCompleted
                ? section.items.length
                : Object.keys(domainAnswers).length;
              const fillPercent = (sectionAnswered / section.items.length) * 100;

              return (
                <div
                  key={section.id}
                  onClick={() => isClickable && handleSectionClick(i)}
                  style={{
                    flex: 1,
                    background: 'var(--glass-border)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    outline: isCurrent ? '1.5px solid var(--accent)' : 'none',
                    outlineOffset: 1,
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                  onMouseLeave={e => { if (isClickable) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  <div style={{
                    height: '100%',
                    width: `${fillPercent}%`,
                    background: isCompleted
                      ? 'linear-gradient(90deg, #c8973a, #d4aa52)'
                      : 'linear-gradient(90deg, #d4bc78, #e0cc8e)',
                    transition: 'width 0.3s ease',
                    borderRadius: 5,
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.6rem',
          }}>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
              section {currentDomainIndex + 1} / {totalDomains}
            </span>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
              {answeredCount} / {items.length} answered
            </span>
          </div>
        </div>

        {/* Domain intro */}
        {showIntro ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <h2 style={{ fontSize: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: 2.2, maxWidth: 560, margin: '0 auto 2rem' }}>
              {intro}
            </p>
            <button className="btn btn-primary" onClick={() => setShowIntro(false)}>
              Let's Go
            </button>
          </div>
        ) : (
          <>
            {/* Single question */}
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              opacity: fading ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}>
              <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {timeframe}
              </p>

              <p style={{
                fontSize: '0.65rem',
                lineHeight: 2.2,
                color: 'var(--text-primary)',
                maxWidth: 600,
                margin: '0 auto 2.5rem',
              }}>
                {currentItem.text}
              </p>

              {/* Likert scale options — stacked vertically */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem',
                maxWidth: 480,
                margin: '0 auto',
              }}>
                {scale.labels.map((label, li) => {
                  const value = li + 1;
                  const isSelected = answers[currentItem.id] === value;
                  return (
                    <button
                      key={li}
                      onClick={() => handleAnswer(currentItem.id, value)}
                      className={isSelected ? 'btn btn-primary btn-option' : 'btn btn-secondary btn-option'}
                      style={{ fontSize: '0.55rem', padding: '0.85rem 1.25rem' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.75rem',
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => fadeToQuestion(questionIndex - 1)}
                style={{
                  fontSize: '0.5rem',
                  visibility: questionIndex === 0 ? 'hidden' : 'visible',
                }}
              >
                Back
              </button>

              {isLastQuestion ? (
                <button
                  className="btn btn-primary"
                  disabled={!allAnswered || submitting}
                  onClick={handleSubmitDomain}
                  style={{ fontSize: '0.5rem' }}
                >
                  {submitting
                    ? 'saving...'
                    : currentDomainIndex >= totalDomains - 1
                      ? 'Finish & See Results'
                      : 'Next Section'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => fadeToQuestion(questionIndex + 1)}
                  style={{ fontSize: '0.5rem' }}
                >
                  Next
                </button>
              )}
            </div>

            {isLastQuestion && !allAnswered && (
              <p style={{ textAlign: 'center', fontSize: '0.45rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                answer all questions to continue
              </p>
            )}
          </>
        )}
      </div>
    </DraggableWindow>
  );
}
