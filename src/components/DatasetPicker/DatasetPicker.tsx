import { useCallback, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { Button } from '@genaitm/components/button/Button';
import { datasetState, ProjectDatasetImage } from '@genaitm/state';
import { canvasToDataUrl, getProjectDatasetImageDisplayId } from '@genaitm/util/projectDatasets';
import { useVariant } from '@genaitm/util/variant';
import ImageTile from './ImageTile';
import styles from './DatasetPicker.module.css';

interface DatasetPickerProps {
    open: boolean;
    onClose: () => void;
    onDatasetSelected: (canvases: HTMLCanvasElement[]) => void;
}

export default function DatasetPicker({ open, onClose, onDatasetSelected }: DatasetPickerProps) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
    const projectDatasets = useAtomValue(datasetState);
    const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(() => new Set());
    const trainingDatasets = projectDatasets.map((dataset) => ({
        dataset,
        images: dataset.images.filter((image) => image.split === 'training'),
    }));
    const trainingImages = trainingDatasets.flatMap(({ images }) => images);

    const handleUse = useCallback(() => {
        const canvases = trainingImages
            .filter((image) => selectedImageIds.has(image.id))
            .map((image) => image.data);
        if (canvases.length === 0) return;

        onDatasetSelected(canvases);
        setSelectedImageIds(new Set());
        onClose();
    }, [onClose, onDatasetSelected, selectedImageIds, trainingImages]);

    const handleClose = useCallback(() => {
        setSelectedImageIds(new Set());
        onClose();
    }, [onClose]);

    const toggleImage = useCallback((image: ProjectDatasetImage) => {
        setSelectedImageIds((current) => {
            const next = new Set(current);
            if (next.has(image.id)) next.delete(image.id);
            else next.add(image.id);
            return next;
        });
    }, []);

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
                    aria-label={t('trainingdata.aria.close')}
                    className={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {trainingDatasets.length === 0 ? (
                    <Typography className={styles.emptyManagedDataset}>
                        {t('dataExplorer.empty.noDatasets')}
                    </Typography>
                ) : (
                    <div className={styles.categoryBox}>
                        <h3 className={styles.categoryTitle}>DataExplorer</h3>
                        {trainingDatasets.map(({ dataset, images }) => (
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
                                            const selected = selectedImageIds.has(image.id);
                                            const datasetImageIndex = dataset.images.findIndex(
                                                (datasetImage) => datasetImage.id === image.id
                                            );
                                            return (
                                                <ImageTile
                                                    key={image.id}
                                                    url={canvasToDataUrl(image.data)}
                                                    alt={t('dataExplorer.labels.image')}
                                                    label={getProjectDatasetImageDisplayId(
                                                        dataset,
                                                        image,
                                                        datasetImageIndex
                                                    )}
                                                    imgClassName={styles.datasetImage}
                                                    selected={selected}
                                                    containerSelected
                                                    showCheckbox
                                                    checked={selected}
                                                    onCheckboxChange={() => toggleImage(image)}
                                                    onClick={() => toggleImage(image)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
                <Button
                    variant="outlined"
                    onClick={handleClose}
                >
                    {t('trainingdata.actions.cancel')}
                </Button>
                <Button
                    onClick={handleUse}
                    disabled={selectedImageIds.size === 0}
                    variant="contained"
                >
                    {t('trainingdata.actions.use', { count: selectedImageIds.size })}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
