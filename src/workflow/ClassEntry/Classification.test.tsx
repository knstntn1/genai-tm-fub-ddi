import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Classification } from './Classification';
import TestWrapper from '../../util/TestWrapper';
import { VariantContext, type IVariantContext } from '../../util/variant';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const translations: Record<string, string> = {
                'trainingdata.actions.webcam': 'Webcam',
                'trainingdata.actions.audio': 'Mikrofon',
                'trainingdata.actions.upload': 'Hochladen',
                'trainingdata.actions.openverse': 'Bildsuche',
                'trainingdata.labels.addSamples': 'Bildbeispiele hinzufügen',
                'trainingdata.labels.addAudioSamples': 'Audiobeispiele hinzufügen',
                'trainingdata.labels.dropFiles': 'oder ziehe Bilder von einer Website oder Datei hierher',
                'trainingdata.labels.dropAudioFiles': 'oder ziehe Audiodateien von einer Website oder Datei hierher',
                'trainingdata.aria.classCard': `Trainingsdaten für ${values?.name ?? ''}`,
                'trainingdata.aria.close': 'Schließen',
                'trainingdata.openverse.title': `OpenVerse: ${values?.className ?? ''}`,
                'trainingdata.openverse.searchLabel': 'Suchbegriff',
                'trainingdata.openverse.searchPlaceholder': 'z. B. Katze',
                'trainingdata.openverse.searchAction': 'Bilder suchen',
                'trainingdata.openverse.initial': 'Suche nach Bildern für diese Klasse.',
            };
            return translations[key] ?? key;
        },
        i18n: { changeLanguage: () => Promise.resolve() },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => {},
    },
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    I18nextProvider: ({ children }: { children: ReactNode }) => children,
}));

const speechVariant: IVariantContext = {
    namespace: 'image_adv',
    modelVariant: 'speech',
    sampleUploadFile: true,
};

describe('Classification component', () => {
    it('renders with no samples and inactive', async ({ expect }) => {
        render(
            <Classification
                name="TestClass"
                index={0}
                active={false}
                data={{ label: 'TestClass', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );
        expect(screen.getByTestId('widget-TestClass')).toBeInTheDocument();
        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
    });

    it('shows the OpenVerse image search action beside camera and upload for image classes', async ({ expect }) => {
        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
        expect(screen.getByTestId('uploadbutton')).toBeInTheDocument();
        expect(screen.getByTestId('openversebutton')).toHaveTextContent('Bildsuche');
    });

    it('opens the OpenVerse dialog with the current class name', async ({ expect }) => {
        const user = userEvent.setup();

        render(
            <Classification
                name="Katze"
                index={0}
                active={false}
                data={{ label: 'Katze', samples: [] }}
                setData={() => {}}
                setActive={() => {}}
                onActivate={() => {}}
                onDelete={() => {}}
            />,
            { wrapper: TestWrapper }
        );

        await user.click(screen.getByTestId('openversebutton'));

        expect(await screen.findByText('OpenVerse: Katze')).toBeInTheDocument();
    });

    it('does not show the OpenVerse image search action for speech classes', async ({ expect }) => {
        render(
            <VariantContext.Provider value={speechVariant}>
                <Classification
                    name="Hintergrundgeräusch"
                    index={0}
                    active={false}
                    data={{ label: 'Hintergrundgeräusch', samples: [] }}
                    setData={() => {}}
                    setActive={() => {}}
                    onActivate={() => {}}
                    onDelete={() => {}}
                />
            </VariantContext.Provider>,
            { wrapper: TestWrapper }
        );

        expect(screen.getByTestId('webcambutton')).toBeInTheDocument();
        expect(screen.queryByTestId('openversebutton')).not.toBeInTheDocument();
        expect(screen.queryByText('Bildsuche')).not.toBeInTheDocument();
    });
});
