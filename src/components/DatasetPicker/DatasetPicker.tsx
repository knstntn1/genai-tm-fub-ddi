import { useCallback, useState, useRef, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Button } from '@genaitm/components/button/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { Dataset, DATASETS, fetchAndCacheDatasets, DatasetImage } from '@genaitm/util/datasets';
import { loadDatasetImagesInParallel, LoadProgress } from '@genaitm/util/datasetLoader';
import { useVariant } from '@genaitm/util/variant';
import DatasetCategoryList, { DatasetCategoryListHandle } from './DatasetCategoryList';
import { ScrollRootContext, useScrollRootRef } from './ScrollRootContext';
import styles from './DatasetPicker.module.css';
import { Alert } from '@mui/material';
import { useAtomValue } from 'jotai';
import { datasetState, ProjectDatasetImage } from '@genaitm/state';
import { canvasToDataUrl } from '@genaitm/util/projectDatasets';
import ImageTile from './ImageTile';

interface DatasetPickerProps {
    open: boolean;
    onClose: () => void;
    onDatasetSelected: (canvases: HTMLCanvasElement[]) => void;
}

export default function DatasetPicker({ open, onClose, onDatasetSelected }: DatasetPickerProps) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
    const [loading, setLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState<LoadProgress>({ loaded: 0, total: 0 });
    const [localDatasets, setLocalDatasets] = useState<Dataset[]>(DATASETS);
    const [selectedCount, setSelectedCount] = useState(0);
    const [selectedManagedImageIds, setSelectedManagedImageIds] = useState<Set<string>>(() => new Set());
    const [scrollRoot, scrollRootRef] = useScrollRootRef();
    const listRef = useRef<DatasetCategoryListHandle>(null);
    const [error, setError] = useState<string | null>(null);
    const projectDatasets = useAtomValue(datasetState);
    const managedTrainingDatasets = projectDatasets.map((dataset) => ({
        dataset,
        images: dataset.images.filter((image) => image.split === 'training'),
    }));
    const managedTrainingImages = managedTrainingDatasets.flatMap(({ images }) => images);

    useEffect(() => {
        if (!open) return;
        if (DATASETS.length > 0) {
            setLocalDatasets([...DATASETS]);
            return;
        }
        fetchAndCacheDatasets().then(setLocalDatasets);
    }, [open]);

    const handleUse = useCallback(async () => {
        const images = listRef.current?.getSelectedImages() ?? [];
        const managedImages = managedTrainingImages.filter((image) => selectedManagedImageIds.has(image.id));
        if (images.length === 0 && managedImages.length === 0) return;

        setLoading(true);
        setLoadProgress({ loaded: 0, total: images.length });

        try {
            const canvases = await loadDatasetImagesInParallel(images as DatasetImage[], (progress) => {
                setLoadProgress(progress);
            });
            const selectedCanvases = [...managedImages.map((image) => image.data), ...canvases];

            if (selectedCanvases.length > 0) {
                onDatasetSelected(selectedCanvases);
                listRef.current?.clearSelection();
                setSelectedManagedImageIds(new Set());
                onClose();
            } else {
                setError(t('trainingdata.labels.datasetLoadError'));
            }
        } catch (error) {
            console.error('Error loading images:', error);
            setError(t('trainingdata.labels.datasetLoadError'));
        } finally {
            setLoading(false);
        }
    }, [managedTrainingImages, onDatasetSelected, onClose, selectedManagedImageIds, t]);

    const handleClose = useCallback(() => {
        if (!loading) {
            listRef.current?.clearSelection();
            setSelectedManagedImageIds(new Set());
            onClose();
        }
    }, [loading, onClose]);

    const toggleManagedImage = useCallback((image: ProjectDatasetImage) => {
        setSelectedManagedImageIds((current) => {
            const next = new Set(current);
            if (next.has(image.id)) next.delete(image.id);
            else next.add(image.id);
            return next;
        });
    }, []);

    const progressPercentage = loadProgress.total > 0 ? (loadProgress.loaded / loadProgress.total) * 100 : 0;
    const totalSelectedCount = selectedCount + selectedManagedImageIds.size;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            slotProps={{ paper: { className: styles.dialogPaper } }}
        >
            <DialogTitle className={styles.dialogTitle}>
                {t('trainingdata.labels.selectDataset')}
                <IconButton
                    onClick={handleClose}
                    disabled={loading}
                    aria-label="close"
                    className={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent ref={scrollRootRef}>
                {!error && (
                    <ScrollRootContext.Provider value={scrollRoot}>
                        {loading ? (
                            <div className={styles.loadingContainer}>
                                <Typography
                                    variant="body1"
                                    gutterBottom
                                >
                                    {t('trainingdata.labels.loadingDataset', {
                                        loaded: loadProgress.loaded,
                                        total: loadProgress.total,
                                    })}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercentage}
                                    className={styles.loadingProgress}
                                />
                            </div>
                        ) : (
                            <>
                                {managedTrainingDatasets.length > 0 && (
                                    <div className={styles.categoryBox}>
                                        <h3 className={styles.categoryTitle}>DataExplorer</h3>
                                        {managedTrainingDatasets.map(({ dataset, images }) => (
                                            <div
                                                className={styles.datasetBox}
                                                key={dataset.id}
                                            >
                                                <div className={`${styles.datasetHeader} ${styles.managedDatasetHeader}`}>
                                                    <span className={styles.datasetName}>{dataset.name}</span>
                                                    <span className={styles.imageCount}>
                                                        ({images.length} {t('trainingdata.labels.images')})
                                                    </span>
                                                </div>
                                                {images.length === 0 ? (
                                                    <p className={styles.emptyManagedDataset}>
                                                        {t('dataExplorer.empty.noTrainingImages')}
                                                    </p>
                                                ) : (
                                                    <div className={styles.imagesRow}>
                                                        {images.map((image) => {
                                                            const selected = selectedManagedImageIds.has(image.id);
                                                            return (
                                                                <ImageTile
                                                                    key={image.id}
                                                                    url={canvasToDataUrl(image.data)}
                                                                    alt={t('dataExplorer.labels.image')}
                                                                    imgClassName={styles.datasetImage}
                                                                    selected={selected}
                                                                    containerSelected
                                                                    showCheckbox
                                                                    checked={selected}
                                                                    onCheckboxChange={() => toggleManagedImage(image)}
                                                                    onClick={() => toggleManagedImage(image)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <DatasetCategoryList
                                    ref={listRef}
                                    datasets={localDatasets}
                                    onSelectionChange={setSelectedCount}
                                />
                            </>
                        )}
                    </ScrollRootContext.Provider>
                )}
                {error && (
                    <Alert
                        severity="error"
                        className={styles.errorAlert}
                    >
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
                <Button
                    variant="outlined"
                    onClick={handleClose}
                    disabled={loading}
                >
                    {t('trainingdata.actions.cancel')}
                </Button>
                <Button
                    onClick={handleUse}
                    disabled={loading || totalSelectedCount === 0}
                    variant="contained"
                >
                    {loading
                        ? t('trainingdata.labels.loading')
                        : t('trainingdata.actions.use', { count: totalSelectedCount })}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
