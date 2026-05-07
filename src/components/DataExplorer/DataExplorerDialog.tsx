import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VideocamIcon from '@mui/icons-material/Videocam';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { canvasesFromFiles } from '@genai-fi/base';
import { Button } from '@genaitm/components/button/Button';
import { datasetState, DatasetSplit } from '@genaitm/state';
import {
    createProjectDataset,
    createProjectDatasetImage,
    removeProjectDatasetImage,
    updateProjectDatasetImageSplit,
} from '@genaitm/util/projectDatasets';
import { importOpenVerseImage } from '@genaitm/util/openverseImageImport';
import type { OpenVerseImageResult } from '@genaitm/util/openverse';
import { useVariant } from '@genaitm/util/variant';
import WebcamCapture from '@genaitm/workflow/ClassEntry/WebcamCapture';
import OpenVerseSearchDialog from '@genaitm/workflow/OpenVerseSearch/OpenVerseSearchDialog';
import styles from './DataExplorerDialog.module.css';

interface Props {
    open: boolean;
    onClose: () => void;
}

function prepareCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    canvas.style.width = '58px';
    canvas.style.height = '58px';
    return canvas;
}

export default function DataExplorerDialog({ open, onClose }: Props) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
    const [datasets, setDatasets] = useAtom(datasetState);
    const [newName, setNewName] = useState('');
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [showOpenVerse, setShowOpenVerse] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedDataset = useMemo(
        () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0],
        [datasets, selectedDatasetId]
    );

    const selectedId = selectedDataset?.id ?? null;

    const addDataset = useCallback(() => {
        const dataset = createProjectDataset(newName || t('dataExplorer.defaultDatasetName'));
        setDatasets((current) => [...current, dataset]);
        setSelectedDatasetId(dataset.id);
        setNewName('');
    }, [newName, setDatasets, t]);

    const deleteSelectedDataset = useCallback(() => {
        if (!selectedId) return;
        setDatasets((current) => current.filter((dataset) => dataset.id !== selectedId));
        setSelectedDatasetId(null);
    }, [selectedId, setDatasets]);

    const addCanvasesToSelected = useCallback(
        (canvases: HTMLCanvasElement[], source: 'upload' | 'webcam' | 'openverse') => {
            if (!selectedId || canvases.length === 0) return false;

            const images = canvases.map((canvas) => createProjectDatasetImage(prepareCanvas(canvas), 'training', source));
            let inserted = false;
            setDatasets((current) =>
                current.map((dataset) => {
                    if (dataset.id !== selectedId) return dataset;
                    inserted = true;
                    return {
                        ...dataset,
                        images: [...images, ...dataset.images],
                    };
                })
            );
            return inserted;
        },
        [selectedId, setDatasets]
    );

    const handleFiles = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            setError(null);
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (files.length === 0) return;

            try {
                const canvases = await canvasesFromFiles(files);
                addCanvasesToSelected(canvases, 'upload');
            } catch {
                setError(t('dataExplorer.errors.addFailed'));
            }
        },
        [addCanvasesToSelected, t]
    );

    const handleCapture = useCallback(
        (canvas: HTMLCanvasElement) => {
            addCanvasesToSelected([canvas], 'webcam');
        },
        [addCanvasesToSelected]
    );

    const handleUseOpenVerseImage = useCallback(
        async (result: OpenVerseImageResult) => {
            const targetId = selectedId;
            if (!targetId) throw new Error('no-dataset-selected');

            const canvas = await importOpenVerseImage({
                imageUrl: result.imageUrl,
                fallbackUrl: result.thumbnailUrl,
            });

            let inserted = false;
            setDatasets((current) =>
                current.map((dataset) => {
                    if (dataset.id !== targetId) return dataset;
                    inserted = true;
                    return {
                        ...dataset,
                        images: [createProjectDatasetImage(prepareCanvas(canvas), 'training', 'openverse'), ...dataset.images],
                    };
                })
            );
            if (!inserted) throw new Error('dataset-missing');
            setShowOpenVerse(false);
        },
        [selectedId, setDatasets]
    );

    const updateSplit = useCallback(
        (imageId: string, split: DatasetSplit) => {
            if (!selectedId) return;
            setDatasets((current) => updateProjectDatasetImageSplit(current, selectedId, imageId, split));
        },
        [selectedId, setDatasets]
    );

    const removeImage = useCallback(
        (imageId: string) => {
            if (!selectedId) return;
            setDatasets((current) => removeProjectDatasetImage(current, selectedId, imageId));
        },
        [selectedId, setDatasets]
    );

    const handleClose = useCallback(() => {
        setError(null);
        setShowWebcam(false);
        setShowOpenVerse(false);
        onClose();
    }, [onClose]);

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
                slotProps={{ paper: { className: styles.dialogPaper } }}
            >
                <DialogTitle className={styles.dialogTitle}>
                    DataExplorer
                    <IconButton
                        onClick={handleClose}
                        aria-label={t('trainingdata.aria.close')}
                        className={styles.closeButton}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert
                            severity="error"
                            className={styles.error}
                        >
                            {error}
                        </Alert>
                    )}
                    <div className={styles.layout}>
                        <aside className={styles.sidebar}>
                            <div className={styles.createRow}>
                                <TextField
                                    label={t('dataExplorer.fields.datasetName')}
                                    value={newName}
                                    onChange={(event) => setNewName(event.target.value)}
                                    size="small"
                                    fullWidth
                                />
                                <IconButton
                                    onClick={addDataset}
                                    aria-label={t('dataExplorer.actions.createDataset')}
                                >
                                    <AddIcon />
                                </IconButton>
                            </div>
                            <div className={styles.datasetList}>
                                {datasets.map((dataset) => (
                                    <Button
                                        key={dataset.id}
                                        variant={dataset.id === selectedId ? 'contained' : 'outlined'}
                                        onClick={() => setSelectedDatasetId(dataset.id)}
                                        className={styles.datasetButton}
                                    >
                                        {dataset.name} ({dataset.images.length})
                                    </Button>
                                ))}
                            </div>
                        </aside>
                        <section className={styles.main}>
                            {!selectedDataset && (
                                <Typography className={styles.emptyState}>{t('dataExplorer.empty.noDatasets')}</Typography>
                            )}
                            {selectedDataset && (
                                <>
                                    <div className={styles.toolbar}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            onChange={handleFiles}
                                            data-testid="dataexplorer-file-input"
                                        />
                                        <Button
                                            variant="outlined"
                                            startIcon={<UploadFileIcon />}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {t('trainingdata.actions.upload')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<VideocamIcon />}
                                            onClick={() => setShowWebcam(true)}
                                        >
                                            {t('trainingdata.actions.webcam')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ImageSearchIcon />}
                                            onClick={() => setShowOpenVerse(true)}
                                        >
                                            {t('trainingdata.actions.openverse')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DeleteIcon />}
                                            onClick={deleteSelectedDataset}
                                        >
                                            {t('dataExplorer.actions.deleteDataset')}
                                        </Button>
                                    </div>
                                    {selectedDataset.images.length === 0 && (
                                        <Typography className={styles.emptyState}>
                                            {t('dataExplorer.empty.noImages')}
                                        </Typography>
                                    )}
                                    <div className={styles.imageGrid}>
                                        {selectedDataset.images.map((image) => (
                                            <article
                                                key={image.id}
                                                className={styles.imageCard}
                                            >
                                                <canvas
                                                    ref={(node) => {
                                                        if (!node) return;
                                                        node.width = image.data.width;
                                                        node.height = image.data.height;
                                                        node.getContext('2d')?.drawImage(image.data, 0, 0);
                                                    }}
                                                    aria-label={t('dataExplorer.labels.image')}
                                                />
                                                <ToggleButtonGroup
                                                    exclusive
                                                    size="small"
                                                    value={image.split}
                                                    onChange={(_, value: DatasetSplit | null) => {
                                                        if (value) updateSplit(image.id, value);
                                                    }}
                                                    className={styles.splitToggle}
                                                >
                                                    <ToggleButton value="training">
                                                        {t('dataExplorer.split.training')}
                                                    </ToggleButton>
                                                    <ToggleButton value="test">{t('dataExplorer.split.test')}</ToggleButton>
                                                </ToggleButtonGroup>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => removeImage(image.id)}
                                                >
                                                    {t('dataExplorer.actions.deleteImage')}
                                                </Button>
                                            </article>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </DialogContent>
            </Dialog>
            <WebcamCapture
                visible={open && showWebcam}
                onCapture={handleCapture}
                onClose={() => setShowWebcam(false)}
            />
            <OpenVerseSearchDialog
                open={open && showOpenVerse}
                className={selectedDataset?.name ?? 'Dataset'}
                onClose={() => setShowOpenVerse(false)}
                onUseImage={handleUseOpenVerseImage}
            />
        </>
    );
}
