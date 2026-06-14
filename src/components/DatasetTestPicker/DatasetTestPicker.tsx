import { useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { datasetState, ProjectDatasetImage } from '@genaitm/state';
import { canvasToDataUrl, getProjectDatasetImageDisplayId } from '@genaitm/util/projectDatasets';
import { useVariant } from '@genaitm/util/variant';
import ImageTile from '../DatasetPicker/ImageTile';
import styles from '../DatasetPicker/DatasetPicker.module.css';

interface DatasetTestPickerProps {
    open: boolean;
    onClose: () => void;
    onImageSelected?: (canvas: HTMLCanvasElement) => void;
    onImageUrlSelected?: (url: string) => void;
}

export default function DatasetTestPicker({
    open,
    onClose,
    onImageSelected,
    onImageUrlSelected,
}: DatasetTestPickerProps) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
    const projectDatasets = useAtomValue(datasetState);
    const testDatasets = projectDatasets.map((dataset) => ({
        dataset,
        images: dataset.images.filter((image) => image.split === 'test'),
    }));

    const handleImageClick = useCallback(
        (image: ProjectDatasetImage) => {
            onImageUrlSelected?.(canvasToDataUrl(image.data));
            onImageSelected?.(image.data);
            onClose();
        },
        [onClose, onImageSelected, onImageUrlSelected]
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{ paper: { className: styles.dialogPaper } }}
        >
            <DialogTitle className={styles.dialogTitle}>
                <FolderIcon />
                {t('trainingdata.labels.selectTestData')}
                <IconButton
                    onClick={onClose}
                    aria-label={t('trainingdata.aria.close')}
                    className={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {testDatasets.length === 0 ? (
                    <Typography className={styles.emptyManagedDataset}>
                        {t('dataExplorer.empty.noDatasets')}
                    </Typography>
                ) : (
                    <div className={styles.categoryBox}>
                        <h3 className={styles.categoryTitle}>DataExplorer</h3>
                        {testDatasets.map(({ dataset, images }) => (
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
                                        {t('dataExplorer.empty.noTestImages')}
                                    </p>
                                ) : (
                                    <div className={styles.imagesRow}>
                                        {images.map((image) => (
                                            <ImageTile
                                                key={image.id}
                                                url={canvasToDataUrl(image.data)}
                                                alt={t('dataExplorer.labels.image')}
                                                label={getProjectDatasetImageDisplayId(
                                                    dataset,
                                                    image,
                                                    dataset.images.findIndex(
                                                        (datasetImage) => datasetImage.id === image.id
                                                    )
                                                )}
                                                imgClassName={styles.testImage}
                                                selected={false}
                                                onClick={() => handleImageClick(image)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
