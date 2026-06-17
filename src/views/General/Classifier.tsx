import { useState, useCallback, useEffect, useRef } from 'react';
import AppBar from '../../components/AppBar/AppBar';
import Workspace from '../../workflow/ImageWorkspace/Workspace';
import { ThemeProvider } from '@mui/material/styles';
import { useVariant } from '../../util/variant';
import { theme } from '@genai-fi/base';
import SettingsDialog from '../SettingsDialog/SettingsDialog';

export default function ImageClassifier() {
    const { modelVariant } = useVariant();
    const [step, setStep] = useState(0);
    const [, setAllowedStep] = useState(0);
    const [visited, setVisited] = useState(0);
    const [saveTrigger, setSaveTrigger] = useState<(() => void) | undefined>(undefined);
    const [showReminder, setShowReminder] = useState(false);
    const lastVariantRef = useRef(modelVariant);

    // Reset stepper to default state when model variant changes
    useEffect(() => {
        if (lastVariantRef.current !== modelVariant) {
            setStep(0);
            setAllowedStep(0);
            setVisited(0);
            lastVariantRef.current = modelVariant;
        }
    }, [modelVariant]);

    const doComplete = useCallback(
        (newstep: number) => {
            setAllowedStep((old: number) => Math.max(old, newstep));
        },
        [setAllowedStep]
    );

    const doSkip = useCallback(
        (newstep: number) => {
            setAllowedStep((old: number) => Math.max(old, newstep));
            setStep(newstep);
            setVisited(newstep);
        },
        [setAllowedStep, setStep]
    );

    const doSaveRemind = useCallback(() => setShowReminder(true), [setShowReminder]);

    const doSave = useCallback(() => setSaveTrigger(() => () => setSaveTrigger(undefined)), [setSaveTrigger]);

    return (
        <ThemeProvider theme={theme}>
            <AppBar
                onSave={doSave}
                showReminder={showReminder}
            />
            <Workspace
                step={step}
                visitedStep={visited}
                onComplete={doComplete}
                saveTrigger={saveTrigger}
                onSkip={doSkip}
                onSaveRemind={doSaveRemind}
            />
            <SettingsDialog />
        </ThemeProvider>
    );
}
